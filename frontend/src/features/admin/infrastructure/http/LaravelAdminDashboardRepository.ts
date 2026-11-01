import axios from "axios";
import { AdminDashboardRequestError } from "@/features/admin/application/errors/AdminDashboardRequestError";
import type { AdminDashboardRepository } from "@/features/admin/application/ports/AdminDashboardRepository";
import type {
  AdminDashboard,
  AdminUser,
  AdminUserFilters,
  AdminUserPage,
  UpdateAdminUserInput,
} from "@/features/admin/domain/entities/AdminDashboard";
import { apiClient } from "@/infrastructure/http/apiClient";
import type { components, operations } from "@/infrastructure/http/generated/openapi";

type AdminDashboardDto = components["schemas"]["AdminDashboard"];
type AdminDashboardEnvelope = components["schemas"]["AdminDashboardEnvelope"];
type AdminUserCollectionEnvelope = components["schemas"]["AdminUserCollectionEnvelope"];
type AdminUserEnvelope = components["schemas"]["AdminUserEnvelope"];
type UpdateAdminUserRequest = components["schemas"]["UpdateAdminUserRequest"];
type AdminUsersQuery = NonNullable<operations["listAdminUsers"]["parameters"]["query"]>;
type LaravelErrorResponse = components["schemas"]["ErrorEnvelope"];

export class LaravelAdminDashboardRepository implements AdminDashboardRepository {
  async getDashboard(): Promise<AdminDashboard> {
    try {
      const response = await apiClient.get<AdminDashboardEnvelope>("/api/v1/admin/dashboard");

      return this.toEntity(response.data.data);
    } catch (error) {
      if (axios.isAxiosError<LaravelErrorResponse>(error)) {
        throw new AdminDashboardRequestError(
          error.response?.data.message ?? error.message ?? "Unable to load admin analytics.",
          error.response?.status,
          error.response?.data.errors ?? {},
        );
      }

      throw error;
    }
  }

  async listUsers(filters: AdminUserFilters): Promise<AdminUserPage> {
    try {
      const params: AdminUsersQuery = {
        search: filters.search,
        role: filters.role,
        status: filters.status,
        page: filters.page,
        perPage: filters.perPage,
      };
      const response = await apiClient.get<AdminUserCollectionEnvelope>(
        "/api/v1/admin/users",
        { params },
      );

      return {
        items: response.data.data.items.map((user) => ({ ...user })),
        pagination: { ...response.data.data.pagination },
      };
    } catch (error) {
      if (axios.isAxiosError<LaravelErrorResponse>(error)) {
        throw new AdminDashboardRequestError(
          error.response?.data.message ??
            error.message ??
            "Unable to load platform user directory.",
          error.response?.status,
          error.response?.data.errors ?? {},
        );
      }

      throw error;
    }
  }

  async updateUser(
    userId: number,
    input: UpdateAdminUserInput,
  ): Promise<AdminUser> {
    try {
      const payload: UpdateAdminUserRequest = {
        role: input.role,
        suspended: input.suspended,
      };

      const response = await apiClient.patch<AdminUserEnvelope>(
        `/api/v1/admin/users/${userId}`,
        payload,
      );

      return { ...response.data.data };
    } catch (error) {
      if (axios.isAxiosError<LaravelErrorResponse>(error)) {
        throw new AdminDashboardRequestError(
          error.response?.data.message ??
            error.message ??
            "Unable to update platform user.",
          error.response?.status,
          error.response?.data.errors ?? {},
        );
      }

      throw error;
    }
  }

  private toEntity(dashboard: AdminDashboardDto): AdminDashboard {
    return {
      stats: {
        totalUsers: { ...dashboard.stats.totalUsers },
        totalEmployers: { ...dashboard.stats.totalEmployers },
        totalJobseekers: { ...dashboard.stats.totalJobseekers },
        totalJobListings: { ...dashboard.stats.totalJobListings },
        applicationsToday: { ...dashboard.stats.applicationsToday },
        hiresThisMonth: { ...dashboard.stats.hiresThisMonth },
      },
      userDistribution: { ...dashboard.userDistribution },
      growth: dashboard.growth.map((point) => ({ ...point })),
      recentActivity: dashboard.recentActivity.map((activity) => ({ ...activity })),
      latestUsers: dashboard.latestUsers.map((user) => ({ ...user })),
      generatedAt: dashboard.generatedAt,
    };
  }
}
