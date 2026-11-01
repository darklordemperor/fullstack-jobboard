import type { JobApplicationStatus } from "@/features/applications/domain/entities/JobApplication";

export interface SubmitJobApplicationInput {
  coverLetter: string;
  resume?: {
    fileName: string;
    mimeType: string;
    size: number;
    bytes: ArrayBuffer;
  };
}

export interface JobApplicationFilters {
  status?: JobApplicationStatus;
  search?: string;
  jobListingId?: number;
  page: number;
  perPage: number;
}
