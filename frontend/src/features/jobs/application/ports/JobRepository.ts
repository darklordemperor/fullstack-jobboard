import type { JobSearchFilters } from "@/features/jobs/application/use-cases/SearchJobs";
import type {
  JobListingDetails,
  JobSearchResult,
} from "@/features/jobs/domain/entities/JobListing";

export interface JobRepository {
  search(filters: JobSearchFilters): Promise<JobSearchResult>;
  getPublishedById(id: number): Promise<JobListingDetails>;
  listSavedJobIds(): Promise<number[]>;
  saveJob(jobListingId: number): Promise<number[]>;
  removeSavedJob(jobListingId: number): Promise<number[]>;
}
