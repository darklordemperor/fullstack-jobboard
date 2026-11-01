export type JobApplicationStatus =
  | "submitted"
  | "reviewing"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";

export type EmployerManagedJobApplicationStatus = Exclude<
  JobApplicationStatus,
  "withdrawn"
>;

export interface JobApplication {
  id: number;
  jobListing: {
    id: number;
    title: string;
  };
  applicant: {
    id: number;
    name: string;
    email: string;
  };
  coverLetter: string;
  resume: {
    available: boolean;
    originalName: string | null;
    size: number | null;
  };
  status: JobApplicationStatus;
  statusChangedAt: string;
  withdrawnAt: string | null;
  appliedAt: string;
  updatedAt: string;
}

export interface JobApplicationCounts {
  total: number;
  submitted: number;
  reviewing: number;
  shortlisted: number;
  rejected: number;
  hired: number;
  withdrawn: number;
}

export interface JobApplicationPage {
  items: JobApplication[];
  pagination: {
    currentPage: number;
    perPage: number;
    lastPage: number;
    total: number;
  };
  counts: JobApplicationCounts;
}
