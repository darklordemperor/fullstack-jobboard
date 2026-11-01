import type {
  AdminDashboard,
  AdminUser,
  AdminUserFilters,
  AdminUserPage,
  UpdateAdminUserInput,
} from "@/features/admin/domain/entities/AdminDashboard";

export interface AdminDashboardRepository {
  getDashboard(): Promise<AdminDashboard>;
  listUsers(filters: AdminUserFilters): Promise<AdminUserPage>;
  updateUser(userId: number, input: UpdateAdminUserInput): Promise<AdminUser>;
}
