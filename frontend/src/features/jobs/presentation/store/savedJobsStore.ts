"use client";

import { create } from "zustand";
import {
  listSavedJobIds,
  toggleSavedJob,
} from "@/features/jobs/composition/jobDependencies";

export interface SavedJobsUseCasePort {
  listSavedJobIds: {
    execute(): Promise<number[]>;
  };
  toggleSavedJob: {
    execute(jobListingId: number, currentlySaved: boolean): Promise<number[]>;
  };
}

export type SavedJobsStatus = "idle" | "loading" | "ready" | "error";

export interface SavedJobsStoreState {
  savedJobIds: number[];
  status: SavedJobsStatus;
  pendingJobIds: number[];
  error: string | null;
  loadSavedJobs: (force?: boolean) => Promise<number[]>;
  toggleSavedJob: (jobListingId: number) => Promise<void>;
  resetSavedJobs: () => void;
}

export function createSavedJobsStore(useCases: SavedJobsUseCasePort) {
  let inflightLoadPromise: Promise<number[]> | null = null;

  return create<SavedJobsStoreState>((set, get) => ({
    savedJobIds: [],
    status: "idle",
    pendingJobIds: [],
    error: null,

    loadSavedJobs: async (force = false) => {
      const currentState = get();
      if (!force && currentState.status === "ready") {
        return currentState.savedJobIds;
      }

      if (!force && inflightLoadPromise) {
        return inflightLoadPromise;
      }

      set({ status: "loading", error: null });

      inflightLoadPromise = useCases.listSavedJobIds
        .execute()
        .then((jobIds) => {
          set({
            savedJobIds: jobIds,
            status: "ready",
            error: null,
          });
          return jobIds;
        })
        .catch(() => {
          set({
            status: "error",
            error: "Unable to load saved jobs.",
          });
          return get().savedJobIds;
        })
        .finally(() => {
          inflightLoadPromise = null;
        });

      return inflightLoadPromise;
    },

    toggleSavedJob: async (jobListingId: number) => {
      const { savedJobIds, pendingJobIds } = get();
      if (pendingJobIds.includes(jobListingId)) {
        return;
      }

      const currentlySaved = savedJobIds.includes(jobListingId);
      const optimisticIds = currentlySaved
        ? savedJobIds.filter((id) => id !== jobListingId)
        : [jobListingId, ...savedJobIds];

      set({
        savedJobIds: optimisticIds,
        pendingJobIds: [...pendingJobIds, jobListingId],
        error: null,
      });

      try {
        const authoritativeIds = await useCases.toggleSavedJob.execute(
          jobListingId,
          currentlySaved,
        );
        set((state) => ({
          savedJobIds: authoritativeIds,
          status: "ready",
          pendingJobIds: state.pendingJobIds.filter((id) => id !== jobListingId),
        }));
      } catch {
        set((state) => ({
          savedJobIds,
          pendingJobIds: state.pendingJobIds.filter((id) => id !== jobListingId),
          error: "Could not update saved job state.",
        }));
      }
    },

    resetSavedJobs: () => {
      inflightLoadPromise = null;
      set({
        savedJobIds: [],
        status: "idle",
        pendingJobIds: [],
        error: null,
      });
    },
  }));
}

export const useSavedJobsStore = createSavedJobsStore({
  listSavedJobIds,
  toggleSavedJob,
});
