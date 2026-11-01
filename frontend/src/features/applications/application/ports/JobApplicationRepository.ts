import type {
  JobApplicationFilters,
  SubmitJobApplicationInput,
} from "@/features/applications/application/dto/JobApplicationInput";
import type {
  EmployerManagedJobApplicationStatus,
  JobApplication,
  JobApplicationPage,
} from "@/features/applications/domain/entities/JobApplication";

export interface JobApplicationRepository {
  submit(jobListingId: number, input: SubmitJobApplicationInput): Promise<JobApplication>;
  listForEmployerJob(
    jobListingId: number,
    filters: JobApplicationFilters,
  ): Promise<JobApplicationPage>;
  listForApplicant(filters: JobApplicationFilters): Promise<JobApplicationPage>;
  updateStatus(
    applicationId: number,
    status: EmployerManagedJobApplicationStatus,
  ): Promise<JobApplication>;
  withdraw(applicationId: number): Promise<JobApplication>;
  resumeDownloadUrl(applicationId: number): string;
}
