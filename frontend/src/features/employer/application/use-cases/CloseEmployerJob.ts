import type { EmployerJobRepository } from "@/features/employer/application/ports/EmployerJobRepository";
import type { EmployerJobListingDetails } from "@/features/employer/domain/entities/EmployerJobListing";

export class CloseEmployerJob {
  constructor(private readonly jobs: EmployerJobRepository) {}

  execute(id: number): Promise<EmployerJobListingDetails> {
    return this.jobs.close(id);
  }
}
