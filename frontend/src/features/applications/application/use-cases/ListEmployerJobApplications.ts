import type { JobApplicationFilters } from "@/features/applications/application/dto/JobApplicationInput";
import type { JobApplicationRepository } from "@/features/applications/application/ports/JobApplicationRepository";
import type { JobApplicationPage } from "@/features/applications/domain/entities/JobApplication";

export class ListEmployerJobApplications {
  constructor(private readonly applications: JobApplicationRepository) {}

  execute(jobListingId: number, filters: JobApplicationFilters): Promise<JobApplicationPage> {
    if (!Number.isInteger(jobListingId) || jobListingId < 1) {
      return Promise.reject(new Error("Invalid job listing identifier."));
    }

    return this.applications.listForEmployerJob(jobListingId, filters);
  }
}
