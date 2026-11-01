import type { AdminDashboardRepository } from "@/features/admin/application/ports/AdminDashboardRepository";
import type { AdminDashboard } from "@/features/admin/domain/entities/AdminDashboard";

export class GetAdminDashboard {
  constructor(private readonly dashboards: AdminDashboardRepository) {}

  execute(): Promise<AdminDashboard> {
    return this.dashboards.getDashboard();
  }
}
