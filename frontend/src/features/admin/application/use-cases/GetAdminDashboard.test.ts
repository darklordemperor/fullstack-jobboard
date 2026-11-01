import { describe, expect, it, vi } from "vitest";
import type { AdminDashboardRepository } from "@/features/admin/application/ports/AdminDashboardRepository";
import { GetAdminDashboard } from "@/features/admin/application/use-cases/GetAdminDashboard";
import { ListAdminUsers } from "@/features/admin/application/use-cases/ListAdminUsers";
import { UpdateAdminUser } from "@/features/admin/application/use-cases/UpdateAdminUser";
import type {
  AdminDashboard,
  AdminUserPage,
} from "@/features/admin/domain/entities/AdminDashboard";

const dashboard: AdminDashboard = {
  stats: {
    totalUsers: { value: 2, changePercent: 100 },
    totalEmployers: { value: 1, changePercent: null },
    totalJobseekers: { value: 1, changePercent: 0 },
    totalJobListings: { value: 1, changePercent: 0 },
    applicationsToday: { value: 1, changePercent: 0 },
    hiresThisMonth: { value: 0, changePercent: 0 },
  },
  userDistribution: { employers: 1, jobseekers: 1 },
  growth: [],
  recentActivity: [],
  latestUsers: [],
  generatedAt: "2026-10-30T12:00:00.000000Z",
};

const userPage: AdminUserPage = {
  items: [
    {
      id: 8,
      name: "Jane Candidate",
      email: "jane@example.com",
      role: "jobseeker",
      status: "verified",
      createdAt: "2026-10-30T10:00:00.000000Z",
    },
  ],
  pagination: {
    currentPage: 1,
    perPage: 10,
    lastPage: 1,
    total: 1,
  },
};

describe("GetAdminDashboard, ListAdminUsers & UpdateAdminUser", () => {
  it("returns analytics and paginated users from the repository boundary", async () => {
    const updatedUser = { ...userPage.items[0], role: "employer" as const };
    const repository: AdminDashboardRepository = {
      getDashboard: vi.fn().mockResolvedValue(dashboard),
      listUsers: vi.fn().mockResolvedValue(userPage),
      updateUser: vi.fn().mockResolvedValue(updatedUser),
    };

    await expect(new GetAdminDashboard(repository).execute()).resolves.toBe(dashboard);
    expect(repository.getDashboard).toHaveBeenCalledOnce();

    const filters = { search: "Jane", role: "jobseeker" as const, page: 1, perPage: 10 };
    await expect(new ListAdminUsers(repository).execute(filters)).resolves.toBe(userPage);
    expect(repository.listUsers).toHaveBeenCalledWith(filters);

    await expect(
      new UpdateAdminUser(repository).execute(3, { role: "employer" }),
    ).resolves.toBe(updatedUser);
    expect(repository.updateUser).toHaveBeenCalledWith(3, { role: "employer" });
  });
});
