import type { AdminDashboardRepository } from "@/features/admin/application/ports/AdminDashboardRepository";
import type {
  AdminUser,
  UpdateAdminUserInput,
} from "@/features/admin/domain/entities/AdminDashboard";

export class UpdateAdminUser {
  constructor(private readonly repository: AdminDashboardRepository) {}

  execute(userId: number, input: UpdateAdminUserInput): Promise<AdminUser> {
    return this.repository.updateUser(userId, input);
  }
}
