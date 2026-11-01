import type { EmployerJobListFilters } from "@/features/employer/application/dto/EmployerJobInput";
import type { EmployerJobRepository } from "@/features/employer/application/ports/EmployerJobRepository";
import type { EmployerJobListingPage } from "@/features/employer/domain/entities/EmployerJobListing";

export class ListEmployerJobs {
  constructor(private readonly jobs: EmployerJobRepository) {}

  execute(filters: EmployerJobListFilters): Promise<EmployerJobListingPage> {
    return this.jobs.list(filters);
  }
}
