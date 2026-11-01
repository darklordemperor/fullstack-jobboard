import type { JobRepository } from "@/features/jobs/application/ports/JobRepository";
import type { JobSearchFilters } from "@/features/jobs/application/use-cases/SearchJobs";
import type {
  JobListing,
  JobListingDetails,
  JobSearchResult,
} from "@/features/jobs/domain/entities/JobListing";
import { apiClient } from "@/infrastructure/http/apiClient";
import type { components, operations } from "@/infrastructure/http/generated/openapi";

type JobListingDto = components["schemas"]["JobListing"];
type JobListingSummaryDto = components["schemas"]["JobListingSummary"];
type JobListingEnvelope = components["schemas"]["JobListingEnvelope"];
type JobSearchEnvelope = components["schemas"]["PublicJobListingCollectionEnvelope"];
type SavedJobListingsEnvelope = components["schemas"]["SavedJobListingsEnvelope"];
type JobSearchQuery = NonNullable<operations["searchJobListings"]["parameters"]["query"]>;

export class LaravelJobRepository implements JobRepository {
  async search(filters: JobSearchFilters): Promise<JobSearchResult> {
    const params: JobSearchQuery = {
      keyword: filters.keyword,
      location: filters.location,
      employmentTypes: filters.employmentTypes,
      salaryCap: filters.salaryCap,
      category: filters.category,
      savedOnly: filters.savedOnly,
      sort: filters.sort,
      page: filters.page,
      perPage: filters.perPage,
    };
    const response = await apiClient.get<JobSearchEnvelope>(
      "/api/v1/job-listings",
      { params },
    );

    return {
      items: response.data.data.items.map((item) => this.toSummary(item)),
      pagination: { ...response.data.data.pagination },
      facets: {
        locations: [...response.data.data.facets.locations],
        employmentTypes: [...response.data.data.facets.employmentTypes],
        categories: [...response.data.data.facets.categories],
      },
    };
  }

  async getPublishedById(id: number): Promise<JobListingDetails> {
    const response = await apiClient.get<JobListingEnvelope>(
      `/api/v1/job-listings/${id}`,
    );

    return this.toDetails(response.data.data);
  }

  async listSavedJobIds(): Promise<number[]> {
    const response = await apiClient.get<SavedJobListingsEnvelope>(
      "/api/v1/jobseeker/saved-jobs",
    );

    return [...response.data.data.jobListingIds];
  }

  async saveJob(jobListingId: number): Promise<number[]> {
    await apiClient.get("/sanctum/csrf-cookie");
    const response = await apiClient.post<SavedJobListingsEnvelope>(
      `/api/v1/jobseeker/saved-jobs/${jobListingId}`,
    );

    return [...response.data.data.jobListingIds];
  }

  async removeSavedJob(jobListingId: number): Promise<number[]> {
    await apiClient.get("/sanctum/csrf-cookie");
    const response = await apiClient.delete<SavedJobListingsEnvelope>(
      `/api/v1/jobseeker/saved-jobs/${jobListingId}`,
    );

    return [...response.data.data.jobListingIds];
  }

  private toSummary(listing: JobListingSummaryDto): JobListing {
    if (listing.publishedAt === null) {
      throw new Error("Published job listing response is missing publishedAt.");
    }

    return {
      id: listing.id,
      title: listing.title,
      employerName: listing.employerName,
      location: listing.location,
      employmentType: listing.employmentType,
      category: listing.category,
      salary: { ...listing.salary },
      publishedAt: listing.publishedAt,
    };
  }

  private toDetails(listing: JobListingDto): JobListingDetails {
    if (listing.status !== "published" || listing.publishedAt === null) {
      throw new Error("Public job detail response must contain a published listing.");
    }

    return {
      id: listing.id,
      title: listing.title,
      employerName: listing.employerName,
      description: listing.description,
      location: listing.location,
      employmentType: listing.employmentType,
      category: listing.category,
      salary: { ...listing.salary },
      status: listing.status,
      publishedAt: listing.publishedAt,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }
}
