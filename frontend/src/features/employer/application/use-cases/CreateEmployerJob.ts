import type { EmployerJobInput } from "@/features/employer/application/dto/EmployerJobInput";
import type { EmployerJobRepository } from "@/features/employer/application/ports/EmployerJobRepository";
import type { EmployerJobListingDetails } from "@/features/employer/domain/entities/EmployerJobListing";

export class CreateEmployerJob {
  constructor(private readonly jobs: EmployerJobRepository) {}

  execute(data: EmployerJobInput): Promise<EmployerJobListingDetails> {
    return this.jobs.create(data);
  }
}
