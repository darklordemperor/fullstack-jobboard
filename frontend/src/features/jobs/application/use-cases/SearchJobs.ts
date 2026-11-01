import type { JobRepository } from "@/features/jobs/application/ports/JobRepository";
import type {
  EmploymentType,
  JobListingSort,
  JobSearchResult,
} from "@/features/jobs/domain/entities/JobListing";

export interface JobSearchFilters {
  keyword?: string;
  location?: string;
  employmentTypes: EmploymentType[];
  salaryCap?: number;
  category?: string;
  savedOnly?: boolean;
  sort: JobListingSort;
  page: number;
  perPage: number;
}

export class SearchJobs {
  constructor(private readonly jobs: JobRepository) {}

  execute(filters: JobSearchFilters): Promise<JobSearchResult> {
    return this.jobs.search({
      ...filters,
      keyword: filters.keyword?.trim() || undefined,
      location: filters.location || undefined,
      category: filters.category || undefined,
      savedOnly: filters.savedOnly ? true : undefined,
    });
  }
}
