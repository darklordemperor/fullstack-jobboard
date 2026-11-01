"use client";

import { create } from "zustand";
import type { JobApplicationFilters } from "@/features/applications/application/dto/JobApplicationInput";
import { listJobseekerApplications } from "@/features/applications/composition/applicationDependencies";
import type {
  JobApplication,
  JobApplicationPage,
} from "@/features/applications/domain/entities/JobApplication";

export interface JobseekerApplicationsUseCasePort {
  listJobseekerApplications: {
    execute(filters: JobApplicationFilters): Promise<JobApplicationPage>;
  };
}

export interface JobseekerApplicationsStoreState {
  applicationsByJobId: Record<number, JobApplication | null>;
  loadingJobIds: number[];
  loadApplicationForJob: (
    jobListingId: number,
    force?: boolean,
  ) => Promise<JobApplication | null>;
  recordApplication: (application: JobApplication) => void;
  resetJobseekerApplications: () => void;
}

export function createJobseekerApplicationsStore(
  useCases: JobseekerApplicationsUseCasePort,
) {
  const inflightByJobId = new Map<number, Promise<JobApplication | null>>();

  return create<JobseekerApplicationsStoreState>((set, get) => ({
    applicationsByJobId: {},
    loadingJobIds: [],

    loadApplicationForJob: async (jobListingId: number, force = false) => {
      if (!Number.isInteger(jobListingId) || jobListingId < 1) {
        return null;
      }

      const currentState = get();
      if (
        !force &&
        Object.prototype.hasOwnProperty.call(
          currentState.applicationsByJobId,
          jobListingId,
        )
      ) {
        return currentState.applicationsByJobId[jobListingId] ?? null;
      }

      const existingPromise = inflightByJobId.get(jobListingId);
      if (!force && existingPromise) {
        return existingPromise;
      }

      set((state) => ({
        loadingJobIds: state.loadingJobIds.includes(jobListingId)
          ? state.loadingJobIds
          : [...state.loadingJobIds, jobListingId],
      }));

      const promise = useCases.listJobseekerApplications
        .execute({
          jobListingId,
          page: 1,
          perPage: 1,
        })
        .then((page) => {
          const matchingApplication =
            page.items.find((item) => item.jobListing.id === jobListingId) ??
            null;

          set((state) => ({
            applicationsByJobId: {
              ...state.applicationsByJobId,
              [jobListingId]: matchingApplication,
            },
          }));

          return matchingApplication;
        })
        .catch(() => null)
        .finally(() => {
          inflightByJobId.delete(jobListingId);
          set((state) => ({
            loadingJobIds: state.loadingJobIds.filter(
              (id) => id !== jobListingId,
            ),
          }));
        });

      inflightByJobId.set(jobListingId, promise);
      return promise;
    },

    recordApplication: (application: JobApplication) => {
      set((state) => ({
        applicationsByJobId: {
          ...state.applicationsByJobId,
          [application.jobListing.id]: application,
        },
      }));
    },

    resetJobseekerApplications: () => {
      inflightByJobId.clear();
      set({
        applicationsByJobId: {},
        loadingJobIds: [],
      });
    },
  }));
}

export const useJobseekerApplicationsStore = createJobseekerApplicationsStore({
  listJobseekerApplications,
});
