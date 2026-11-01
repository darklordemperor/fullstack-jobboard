import type { JobApplicationRepository } from "@/features/applications/application/ports/JobApplicationRepository";

export class GetResumeDownloadUrl {
  constructor(private readonly applications: JobApplicationRepository) {}

  execute(applicationId: number): string {
    if (!Number.isInteger(applicationId) || applicationId < 1) {
      throw new Error("Invalid job application identifier.");
    }

    return this.applications.resumeDownloadUrl(applicationId);
  }
}
