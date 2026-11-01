export type EmployerJobStatus = "draft" | "published" | "closed";
export type EmployerEmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "remote";

export interface EmployerJobListingSummary {
  id: number;
  title: string;
  location: string;
  employmentType: EmployerEmploymentType;
  category: string;
  salary: {
    minimum: number;
    maximum: number;
    currency: string;
  };
  status: EmployerJobStatus;
  applicationsCount: number;
  shortlistedCount: number;
  publishedAt: string | null;
  updatedAt: string;
}

export interface EmployerJobListingDetails
  extends Omit<
    EmployerJobListingSummary,
    "applicationsCount" | "shortlistedCount"
  > {
  employerId: number;
  employerName: string;
  description: string;
  createdAt: string;
  applicationsCount?: number;
  shortlistedCount?: number;
}

export interface EmployerJobListingCounts {
  total: number;
  draft: number;
  published: number;
  closed: number;
}

export interface EmployerJobListingPage {
  items: EmployerJobListingSummary[];
  pagination: {
    currentPage: number;
    perPage: number;
    lastPage: number;
    total: number;
  };
  counts: EmployerJobListingCounts;
}
