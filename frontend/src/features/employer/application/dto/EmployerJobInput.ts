import type { EmployerEmploymentType } from "@/features/employer/domain/entities/EmployerJobListing";

export interface EmployerJobInput {
  title: string;
  description: string;
  location: string;
  employmentType: EmployerEmploymentType;
  category: string;
  salaryMinimum: number;
  salaryMaximum: number;
}

export interface EmployerJobListFilters {
  status?: "draft" | "published" | "closed";
  search?: string;
  page: number;
  perPage: number;
}
