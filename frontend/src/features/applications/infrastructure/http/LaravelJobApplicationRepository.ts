import axios from "axios";
import type {
  JobApplicationFilters,
  SubmitJobApplicationInput,
} from "@/features/applications/application/dto/JobApplicationInput";
import { JobApplicationRequestError } from "@/features/applications/application/errors/JobApplicationRequestError";
import type { JobApplicationRepository } from "@/features/applications/application/ports/JobApplicationRepository";
import type {
  EmployerManagedJobApplicationStatus,
  JobApplication,
  JobApplicationPage,
} from "@/features/applications/domain/entities/JobApplication";
import { apiClient } from "@/infrastructure/http/apiClient";
import type { components, operations } from "@/infrastructure/http/generated/openapi";

type LaravelErrorResponse = components["schemas"]["ErrorEnvelope"];
type JobApplicationDto = components["schemas"]["JobApplication"];
type JobApplicationEnvelope = components["schemas"]["JobApplicationEnvelope"];
type JobApplicationPageEnvelope = components["schemas"]["JobApplicationCollectionEnvelope"];
type JobApplicationWriteRequest = components["schemas"]["JobApplicationWriteRequest"];
type JobApplicationStatusRequest = components["schemas"]["JobApplicationStatusRequest"];
type JobApplicationQuery = NonNullable<
  operations["listJobseekerApplications"]["parameters"]["query"]
>;
type EmployerJobApplicationQuery = NonNullable<
  operations["listEmployerJobApplications"]["parameters"]["query"]
>;

export class LaravelJobApplicationRepository implements JobApplicationRepository {
  async submit(jobListingId: number, input: SubmitJobApplicationInput): Promise<JobApplication> {
    return this.mutate(async () => {
      const payload = new FormData();
      const request: Pick<JobApplicationWriteRequest, "coverLetter"> = {
        coverLetter: input.coverLetter,
      };
      payload.append("coverLetter", request.coverLetter);
      if (input.resume) {
        payload.append(
          "resume",
          new Blob([input.resume.bytes], { type: input.resume.mimeType }),
          input.resume.fileName,
        );
      }
      const response = await apiClient.post<JobApplicationEnvelope>(
        `/api/v1/job-listings/${jobListingId}/applications`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return this.toEntity(response.data.data);
    });
  }

  async listForApplicant(filters: JobApplicationFilters): Promise<JobApplicationPage> {
    return this.execute(async () => {
      const params: JobApplicationQuery = filters;
      const response = await apiClient.get<JobApplicationPageEnvelope>(
        "/api/v1/jobseeker/applications",
        { params },
      );
      return this.toPage(response.data.data);
    });
  }

  async listForEmployerJob(
    jobListingId: number,
    filters: JobApplicationFilters,
  ): Promise<JobApplicationPage> {
    return this.execute(async () => {
      const params: EmployerJobApplicationQuery = {
        status: filters.status,
        search: filters.search,
        page: filters.page,
        perPage: filters.perPage,
      };
      const response = await apiClient.get<JobApplicationPageEnvelope>(
        `/api/v1/employer/job-listings/${jobListingId}/applications`,
        { params },
      );
      return this.toPage(response.data.data);
    });
  }

  async updateStatus(
    applicationId: number,
    status: EmployerManagedJobApplicationStatus,
  ): Promise<JobApplication> {
    return this.mutate(async () => {
      const payload: JobApplicationStatusRequest = { status };
      const response = await apiClient.patch<JobApplicationEnvelope>(
        `/api/v1/employer/applications/${applicationId}/status`,
        payload,
      );
      return this.toEntity(response.data.data);
    });
  }

  async withdraw(applicationId: number): Promise<JobApplication> {
    return this.mutate(async () => {
      const response = await apiClient.patch<JobApplicationEnvelope>(
        `/api/v1/jobseeker/applications/${applicationId}/withdraw`,
      );
      return this.toEntity(response.data.data);
    });
  }

  resumeDownloadUrl(applicationId: number): string {
    return `/api/v1/job-applications/${applicationId}/resume`;
  }

  private async mutate<T>(operation: () => Promise<T>): Promise<T> {
    return this.execute(async () => {
      await apiClient.get("/sanctum/csrf-cookie");
      return operation();
    });
  }

  private toEntity(application: JobApplicationDto): JobApplication {
    return {
      id: application.id,
      jobListing: { ...application.jobListing },
      applicant: { ...application.applicant },
      coverLetter: application.coverLetter,
      resume: { ...application.resume },
      status: application.status,
      statusChangedAt: application.statusChangedAt,
      withdrawnAt: application.withdrawnAt,
      appliedAt: application.appliedAt,
      updatedAt: application.updatedAt,
    };
  }

  private toPage(data: JobApplicationPageEnvelope["data"]): JobApplicationPage {
    return {
      items: data.items.map((item) => this.toEntity(item)),
      pagination: { ...data.pagination },
      counts: { ...data.counts },
    };
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (axios.isAxiosError<LaravelErrorResponse>(error)) {
        throw new JobApplicationRequestError(
          error.response?.data.message ?? error.message ?? "Job application request failed.",
          error.response?.status,
          error.response?.data.errors ?? {},
        );
      }
      throw error;
    }
  }
}
