import type { JobRepository } from "@/features/jobs/application/ports/JobRepository";

export class ToggleSavedJob {
  constructor(private readonly jobs: JobRepository) {}

  execute(jobListingId: number, currentlySaved: boolean): Promise<number[]> {
    if (!Number.isInteger(jobListingId) || jobListingId < 1) {
      return Promise.reject(new Error("Invalid job listing identifier."));
    }

    return currentlySaved
      ? this.jobs.removeSavedJob(jobListingId)
      : this.jobs.saveJob(jobListingId);
  }
}
