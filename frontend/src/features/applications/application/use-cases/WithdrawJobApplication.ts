import type { JobApplicationRepository } from "@/features/applications/application/ports/JobApplicationRepository";
import type { JobApplication } from "@/features/applications/domain/entities/JobApplication";

export class WithdrawJobApplication {
  constructor(private readonly applications: JobApplicationRepository) {}

  execute(applicationId: number): Promise<JobApplication> {
    if (!Number.isInteger(applicationId) || applicationId < 1) {
      return Promise.reject(new Error("Invalid job application identifier."));
    }

    return this.applications.withdraw(applicationId);
  }
}
