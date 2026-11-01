import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboardRequestError } from "@/features/admin/application/errors/AdminDashboardRequestError";
import { LaravelAdminDashboardRepository } from "@/features/admin/infrastructure/http/LaravelAdminDashboardRepository";

const client = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));
vi.mock("@/infrastructure/http/apiClient", () => ({ apiClient: client }));

const dashboard = {
  stats: {
    totalUsers: { value: 2, changePercent: 100 },
    totalEmployers: { value: 1, changePercent: null },
    totalJobseekers: { value: 1, changePercent: 0 },
    totalJobListings: { value: 1, changePercent: 0 },
    applicationsToday: { value: 1, changePercent: 0 },
    hiresThisMonth: { value: 0, changePercent: 0 },
  },
  userDistribution: { employers: 1, jobseekers: 1 },
  growth: [{ month: "2026-10", newUsers: 2, newJobListings: 1, applications: 1 }],
  recentActivity: [
    {
      type: "user_registered" as const,
      description: "Jane Candidate registered as a jobseeker.",
      occurredAt: "2026-10-30T10:00:00.000000Z",
    },
  ],
  latestUsers: [
    {
      id: 8,
      name: "Jane Candidate",
      email: "jane@example.com",
      role: "jobseeker" as const,
      status: "verified" as const,
      createdAt: "2026-10-30T10:00:00.000000Z",
    },
  ],
  generatedAt: "2026-10-30T12:00:00.000000Z",
};

describe("LaravelAdminDashboardRepository", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads and maps the generated admin dashboard contract", async () => {
    client.get.mockResolvedValue({ data: { success: true, data: dashboard, message: "OK", errors: null } });

    const result = await new LaravelAdminDashboardRepository().getDashboard();

    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/dashboard");
    expect(result).toEqual(dashboard);
    expect(result).not.toBe(dashboard);
    expect(result.latestUsers[0]).not.toBe(dashboard.latestUsers[0]);
  });

  it("loads and maps the paginated admin user directory contract", async () => {
    const userPage = {
      items: dashboard.latestUsers,
      pagination: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
    };
    client.get.mockResolvedValue({ data: { success: true, data: userPage, message: "OK", errors: null } });

    const result = await new LaravelAdminDashboardRepository().listUsers({
      search: "Jane",
      role: "jobseeker",
      status: "verified",
      page: 1,
      perPage: 10,
    });

    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/users", {
      params: {
        search: "Jane",
        role: "jobseeker",
        status: "verified",
        page: 1,
        perPage: 10,
      },
    });
    expect(result).toEqual(userPage);
    expect(result.items[0]).not.toBe(userPage.items[0]);
  });

  it("converts Laravel HTTP failures into an application error", async () => {
    const error = new axios.AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
      data: { success: false, data: null, message: "Forbidden", errors: {} },
      status: 403,
      statusText: "Forbidden",
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
    });
    client.get.mockRejectedValue(error);

    await expect(new LaravelAdminDashboardRepository().getDashboard()).rejects.toMatchObject({
      name: "AdminDashboardRequestError",
      message: "Forbidden",
      status: 403,
    } satisfies Partial<AdminDashboardRequestError>);
  });

  it("updates user role and status through the patch endpoint", async () => {
    const updatedUser = {
      id: 8,
      name: "Jane Candidate",
      email: "jane@example.com",
      role: "employer" as const,
      status: "suspended" as const,
      createdAt: "2026-10-30T10:00:00.000000Z",
    };
    client.patch.mockResolvedValue({
      data: { success: true, data: updatedUser, message: "OK", errors: null },
    });

    const result = await new LaravelAdminDashboardRepository().updateUser(8, {
      role: "employer",
      suspended: true,
    });

    expect(client.patch).toHaveBeenCalledWith("/api/v1/admin/users/8", {
      role: "employer",
      suspended: true,
    });
    expect(result).toEqual(updatedUser);
  });
});
