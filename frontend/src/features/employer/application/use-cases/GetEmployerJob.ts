import type { EmployerJobRepository } from "@/features/employer/application/ports/EmployerJobRepository";
import type { EmployerJobListingDetails } from "@/features/employer/domain/entities/EmployerJobListing";

export class GetEmployerJob {
  constructor(private readonly jobs: EmployerJobRepository) {}

  execute(id: number): Promise<EmployerJobListingDetails> {
    if (!Number.isInteger(id) || id < 1) {
      return Promise.reject(new Error("Invalid job listing identifier."));
    }

    return this.jobs.getById(id);
  }
}
