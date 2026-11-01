import type { JobApplicationFilters } from "@/features/applications/application/dto/JobApplicationInput";
import type { JobApplicationRepository } from "@/features/applications/application/ports/JobApplicationRepository";
import type { JobApplicationPage } from "@/features/applications/domain/entities/JobApplication";

export class ListJobseekerApplications {
  constructor(private readonly applications: JobApplicationRepository) {}

  execute(filters: JobApplicationFilters): Promise<JobApplicationPage> {
    return this.applications.listForApplicant(filters);
  }
}
