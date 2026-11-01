export type EmploymentType = "full_time" | "part_time" | "contract" | "remote";
export type JobListingSort = "newest" | "salary_desc";

export interface JobListing {
  id: number;
  title: string;
  employerName: string;
  location: string;
  employmentType: EmploymentType;
  category: string;
  salary: {
    minimum: number;
    maximum: number;
    currency: string;
  };
  publishedAt: string;
}

export interface JobListingDetails extends JobListing {
  description: string;
  status: "published";
  createdAt: string;
  updatedAt: string;
}

export interface JobListingFacets {
  locations: string[];
  employmentTypes: EmploymentType[];
  categories: string[];
}

export interface JobListingPagination {
  currentPage: number;
  perPage: number;
  lastPage: number;
  total: number;
}

export interface JobSearchResult {
  items: JobListing[];
  pagination: JobListingPagination;
  facets: JobListingFacets;
}
