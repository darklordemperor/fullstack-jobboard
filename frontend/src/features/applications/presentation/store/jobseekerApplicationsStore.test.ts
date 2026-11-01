import { describe, expect, it, vi } from "vitest";
import type { JobApplicationFilters } from "@/features/applications/application/dto/JobApplicationInput";
import type {
  JobApplication,
  JobApplicationPage,
} from "@/features/applications/domain/entities/JobApplication";
import { createJobseekerApplicationsStore } from "@/features/applications/presentation/store/jobseekerApplicationsStore";

const sampleApplication: JobApplication = {
  id: 19,
  jobListing: { id: 42, title: "Senior Platform Engineer" },
  applicant: { id: 5, name: "Seeker User", email: "seeker@jobboard.com" },
  coverLetter: "Experienced distributed systems engineer.",
  resume: { available: true, originalName: "seeker-cv.pdf", size: 4096 },
  status: "shortlisted",
  statusChangedAt: "2026-10-30T10:00:00.000000Z",
  withdrawnAt: null,
  appliedAt: "2026-10-29T09:00:00.000000Z",
  updatedAt: "2026-10-30T10:00:00.000000Z",
};

const emptyCounts = {
  total: 1,
  submitted: 0,
  reviewing: 0,
  shortlisted: 1,
  rejected: 0,
  hired: 0,
  withdrawn: 0,
};

describe("jobseekerApplicationsStore", () => {
  it("loads and caches a candidate application for a specific job listing ID", async () => {
    const execute = vi.fn<
      (filters: JobApplicationFilters) => Promise<JobApplicationPage>
    >();
    execute.mockResolvedValue({
      items: [sampleApplication],
      pagination: { currentPage: 1, perPage: 1, lastPage: 1, total: 1 },
      counts: emptyCounts,
    });

    const store = createJobseekerApplicationsStore({
      listJobseekerApplications: { execute },
    });

    const first = await store.getState().loadApplicationForJob(42);
    const second = await store.getState().loadApplicationForJob(42);

    expect(first).toEqual(sampleApplication);
    expect(second).toEqual(sampleApplication);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({
      jobListingId: 42,
      page: 1,
      perPage: 1,
    });
  });

  it("records a newly submitted application and clears cache on reset", () => {
    const execute = vi.fn();
    const store = createJobseekerApplicationsStore({
      listJobseekerApplications: { execute },
    });

    store.getState().recordApplication(sampleApplication);
    expect(store.getState().applicationsByJobId[42]).toEqual(sampleApplication);

    store.getState().resetJobseekerApplications();
    expect(store.getState().applicationsByJobId).toEqual({});
  });
});
