import type { JobRepository } from "@/features/jobs/application/ports/JobRepository";
import type { JobListingDetails } from "@/features/jobs/domain/entities/JobListing";

export class GetJobListing {
  constructor(private readonly jobs: JobRepository) {}

  execute(id: number): Promise<JobListingDetails> {
    if (!Number.isInteger(id) || id < 1) {
      return Promise.reject(new Error("Invalid job listing identifier."));
    }

    return this.jobs.getPublishedById(id);
  }
}
