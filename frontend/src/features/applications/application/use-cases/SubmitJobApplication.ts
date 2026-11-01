import type { SubmitJobApplicationInput } from "@/features/applications/application/dto/JobApplicationInput";
import type { JobApplicationRepository } from "@/features/applications/application/ports/JobApplicationRepository";
import type { JobApplication } from "@/features/applications/domain/entities/JobApplication";

export class SubmitJobApplication {
  constructor(private readonly applications: JobApplicationRepository) {}

  execute(jobListingId: number, input: SubmitJobApplicationInput): Promise<JobApplication> {
    if (!Number.isInteger(jobListingId) || jobListingId < 1) {
      return Promise.reject(new Error("Invalid job listing identifier."));
    }

    return this.applications.submit(jobListingId, input);
  }
}
