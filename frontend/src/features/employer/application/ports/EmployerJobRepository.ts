import type {
  EmployerJobInput,
  EmployerJobListFilters,
} from "@/features/employer/application/dto/EmployerJobInput";
import type {
  EmployerJobListingDetails,
  EmployerJobListingPage,
} from "@/features/employer/domain/entities/EmployerJobListing";

export interface EmployerJobRepository {
  list(filters: EmployerJobListFilters): Promise<EmployerJobListingPage>;
  getById(id: number): Promise<EmployerJobListingDetails>;
  create(data: EmployerJobInput): Promise<EmployerJobListingDetails>;
  update(id: number, data: EmployerJobInput): Promise<EmployerJobListingDetails>;
  publish(id: number): Promise<EmployerJobListingDetails>;
  close(id: number): Promise<EmployerJobListingDetails>;
}
