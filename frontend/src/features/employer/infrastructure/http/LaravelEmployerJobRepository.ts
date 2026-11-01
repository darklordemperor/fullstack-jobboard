import axios from "axios";
import type {
  EmployerJobInput,
  EmployerJobListFilters,
} from "@/features/employer/application/dto/EmployerJobInput";
import { EmployerJobRequestError } from "@/features/employer/application/errors/EmployerJobRequestError";
import type { EmployerJobRepository } from "@/features/employer/application/ports/EmployerJobRepository";
import type {
  EmployerJobListingDetails,
  EmployerJobListingPage,
  EmployerJobListingSummary,
} from "@/features/employer/domain/entities/EmployerJobListing";
import { apiClient } from "@/infrastructure/http/apiClient";
import type { components, operations } from "@/infrastructure/http/generated/openapi";

type LaravelErrorResponse = components["schemas"]["ErrorEnvelope"];
type JobListingDto = components["schemas"]["JobListing"];
type JobListingSummaryDto = components["schemas"]["EmployerJobListingSummary"];
type JobListingEnvelope = components["schemas"]["JobListingEnvelope"];
type JobListingPageEnvelope = components["schemas"]["EmployerJobListingCollectionEnvelope"];
type JobListingWriteRequest = components["schemas"]["JobListingWriteRequest"];
type JobListingQuery = NonNullable<operations["listEmployerJobListings"]["parameters"]["query"]>;

export class LaravelEmployerJobRepository implements EmployerJobRepository {
  async list(filters: EmployerJobListFilters): Promise<EmployerJobListingPage> {
    return this.execute(async () => {
      const params: JobListingQuery = filters;
      const response = await apiClient.get<JobListingPageEnvelope>(
        "/api/v1/employer/job-listings",
        { params },
      );

      return {
        items: response.data.data.items.map((item) => this.toSummary(item)),
        pagination: { ...response.data.data.pagination },
        counts: { ...response.data.data.counts },
      };
    });
  }

  async getById(id: number): Promise<EmployerJobListingDetails> {
    return this.execute(async () => {
      const response = await apiClient.get<JobListingEnvelope>(
        `/api/v1/employer/job-listings/${id}`,
      );

      return this.toDetails(response.data.data);
    });
  }

  async create(data: EmployerJobInput): Promise<EmployerJobListingDetails> {
    return this.mutate(async () => {
      const payload: JobListingWriteRequest = data;
      const response = await apiClient.post<JobListingEnvelope>(
        "/api/v1/employer/job-listings",
        payload,
      );

      return this.toDetails(response.data.data);
    });
  }

  async update(id: number, data: EmployerJobInput): Promise<EmployerJobListingDetails> {
    return this.mutate(async () => {
      const payload: JobListingWriteRequest = data;
      const response = await apiClient.put<JobListingEnvelope>(
        `/api/v1/employer/job-listings/${id}`,
        payload,
      );

      return this.toDetails(response.data.data);
    });
  }

  async publish(id: number): Promise<EmployerJobListingDetails> {
    return this.mutate(async () => {
      const response = await apiClient.post<JobListingEnvelope>(
        `/api/v1/employer/job-listings/${id}/publish`,
      );

      return this.toDetails(response.data.data);
    });
  }

  async close(id: number): Promise<EmployerJobListingDetails> {
    return this.mutate(async () => {
      const response = await apiClient.post<JobListingEnvelope>(
        `/api/v1/employer/job-listings/${id}/close`,
      );

      return this.toDetails(response.data.data);
    });
  }

  private async mutate<T>(operation: () => Promise<T>): Promise<T> {
    return this.execute(async () => {
      await apiClient.get("/sanctum/csrf-cookie");
      return operation();
    });
  }

  private toSummary(listing: JobListingSummaryDto): EmployerJobListingSummary {
    return {
      id: listing.id,
      title: listing.title,
      location: listing.location,
      employmentType: listing.employmentType,
      category: listing.category,
      salary: { ...listing.salary },
      status: listing.status,
      applicationsCount: listing.applicationsCount,
      shortlistedCount: listing.shortlistedCount,
      publishedAt: listing.publishedAt,
      updatedAt: listing.updatedAt,
    };
  }

  private toDetails(listing: JobListingDto): EmployerJobListingDetails {
    return {
      id: listing.id,
      title: listing.title,
      location: listing.location,
      employmentType: listing.employmentType,
      category: listing.category,
      salary: { ...listing.salary },
      status: listing.status,
      publishedAt: listing.publishedAt,
      updatedAt: listing.updatedAt,
      employerId: listing.employerId,
      employerName: listing.employerName,
      description: listing.description,
      createdAt: listing.createdAt,
    };
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (axios.isAxiosError<LaravelErrorResponse>(error)) {
        throw new EmployerJobRequestError(
          error.response?.data.message ?? error.message ?? "Job listing request failed.",
          error.response?.status,
          error.response?.data.errors ?? {},
        );
      }

      throw error;
    }
  }
}
