import { describe, expect, it, vi } from "vitest";
import type { JobRepository } from "@/features/jobs/application/ports/JobRepository";
import { ListSavedJobIds } from "@/features/jobs/application/use-cases/ListSavedJobIds";
import { ToggleSavedJob } from "@/features/jobs/application/use-cases/ToggleSavedJob";

function createJobRepositoryStub(): {
  repository: JobRepository;
  listSavedJobIds: ReturnType<typeof vi.fn>;
  saveJob: ReturnType<typeof vi.fn>;
  removeSavedJob: ReturnType<typeof vi.fn>;
} {
  const listSavedJobIds = vi.fn<() => Promise<number[]>>();
  const saveJob = vi.fn<(jobListingId: number) => Promise<number[]>>();
  const removeSavedJob = vi.fn<(jobListingId: number) => Promise<number[]>>();

  return {
    repository: {
      search: vi.fn(),
      getPublishedById: vi.fn(),
      listSavedJobIds,
      saveJob,
      removeSavedJob,
    },
    listSavedJobIds,
    saveJob,
    removeSavedJob,
  };
}

describe("SavedJobs use cases", () => {
  it("lists saved job listing IDs from the repository", async () => {
    const { repository, listSavedJobIds } = createJobRepositoryStub();
    listSavedJobIds.mockResolvedValue([12, 5]);

    const result = await new ListSavedJobIds(repository).execute();

    expect(result).toEqual([12, 5]);
    expect(listSavedJobIds).toHaveBeenCalledTimes(1);
  });

  it("saves or removes a job listing based on current saved state", async () => {
    const { repository, saveJob, removeSavedJob } = createJobRepositoryStub();
    saveJob.mockResolvedValue([9, 3]);
    removeSavedJob.mockResolvedValue([3]);

    const useCase = new ToggleSavedJob(repository);

    await expect(useCase.execute(9, false)).resolves.toEqual([9, 3]);
    expect(saveJob).toHaveBeenCalledWith(9);

    await expect(useCase.execute(9, true)).resolves.toEqual([3]);
    expect(removeSavedJob).toHaveBeenCalledWith(9);
  });

  it("rejects invalid job listing IDs when toggling saved state", async () => {
    const { repository } = createJobRepositoryStub();
    const useCase = new ToggleSavedJob(repository);

    await expect(useCase.execute(0, false)).rejects.toThrow(
      "Invalid job listing identifier.",
    );
    await expect(useCase.execute(-4, true)).rejects.toThrow(
      "Invalid job listing identifier.",
    );
  });
});
