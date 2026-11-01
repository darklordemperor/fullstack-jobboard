import type { AdminDashboardRepository } from "@/features/admin/application/ports/AdminDashboardRepository";
import type {
  AdminUserFilters,
  AdminUserPage,
} from "@/features/admin/domain/entities/AdminDashboard";

export class ListAdminUsers {
  constructor(private readonly repository: AdminDashboardRepository) {}

  execute(filters: AdminUserFilters): Promise<AdminUserPage> {
    return this.repository.listUsers(filters);
  }
}
