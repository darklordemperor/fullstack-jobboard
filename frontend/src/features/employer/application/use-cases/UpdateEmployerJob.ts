import type { EmployerJobInput } from "@/features/employer/application/dto/EmployerJobInput";
import type { EmployerJobRepository } from "@/features/employer/application/ports/EmployerJobRepository";
import type { EmployerJobListingDetails } from "@/features/employer/domain/entities/EmployerJobListing";

export class UpdateEmployerJob {
  constructor(private readonly jobs: EmployerJobRepository) {}

  execute(id: number, data: EmployerJobInput): Promise<EmployerJobListingDetails> {
    return this.jobs.update(id, data);
  }
}
