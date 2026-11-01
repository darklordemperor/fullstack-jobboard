import { describe, expect, it, vi } from "vitest";
import {
  createSavedJobsStore,
  type SavedJobsUseCasePort,
} from "@/features/jobs/presentation/store/savedJobsStore";

function createSavedJobsUseCaseStub(): {
  useCases: SavedJobsUseCasePort;
  listExecute: ReturnType<typeof vi.fn>;
  toggleExecute: ReturnType<typeof vi.fn>;
} {
  const listExecute = vi.fn<() => Promise<number[]>>();
  const toggleExecute = vi.fn<
    (jobListingId: number, currentlySaved: boolean) => Promise<number[]>
  >();

  return {
    useCases: {
      listSavedJobIds: { execute: listExecute },
      toggleSavedJob: { execute: toggleExecute },
    },
    listExecute,
    toggleExecute,
  };
}

describe("savedJobsStore", () => {
  it("loads saved job IDs and deduplicates concurrent load requests", async () => {
    const { useCases, listExecute } = createSavedJobsUseCaseStub();
    let resolveLoad!: (ids: number[]) => void;
    listExecute.mockImplementation(
      () =>
        new Promise<number[]>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const store = createSavedJobsStore(useCases);

    const firstPromise = store.getState().loadSavedJobs();
    const secondPromise = store.getState().loadSavedJobs();

    expect(store.getState().status).toBe("loading");
    expect(listExecute).toHaveBeenCalledTimes(1);

    resolveLoad([14, 8]);
    await expect(Promise.all([firstPromise, secondPromise])).resolves.toEqual([
      [14, 8],
      [14, 8],
    ]);

    expect(store.getState().savedJobIds).toEqual([14, 8]);
    expect(store.getState().status).toBe("ready");
  });

  it("optimistically toggles a saved job and reconciles with server IDs", async () => {
    const { useCases, toggleExecute } = createSavedJobsUseCaseStub();
    let resolveToggle!: (ids: number[]) => void;
    toggleExecute.mockImplementation(
      () =>
        new Promise<number[]>((resolve) => {
          resolveToggle = resolve;
        }),
    );

    const store = createSavedJobsStore(useCases);
    store.setState({ savedJobIds: [4], status: "ready" });

    const togglePromise = store.getState().toggleSavedJob(9);

    expect(store.getState().savedJobIds).toEqual([9, 4]);
    expect(store.getState().pendingJobIds).toEqual([9]);
    expect(toggleExecute).toHaveBeenCalledWith(9, false);

    resolveToggle([9, 4]);
    await togglePromise;

    expect(store.getState().savedJobIds).toEqual([9, 4]);
    expect(store.getState().pendingJobIds).toEqual([]);
  });

  it("rolls back optimistic bookmark state when the API call fails", async () => {
    const { useCases, toggleExecute } = createSavedJobsUseCaseStub();
    toggleExecute.mockRejectedValue(new Error("Network error"));

    const store = createSavedJobsStore(useCases);
    store.setState({ savedJobIds: [4, 2], status: "ready" });

    await store.getState().toggleSavedJob(4);

    expect(store.getState().savedJobIds).toEqual([4, 2]);
    expect(store.getState().pendingJobIds).toEqual([]);
    expect(store.getState().error).toBe("Could not update saved job state.");
  });
});
