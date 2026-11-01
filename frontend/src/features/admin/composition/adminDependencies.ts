import { GetAdminDashboard } from "@/features/admin/application/use-cases/GetAdminDashboard";
import { ListAdminUsers } from "@/features/admin/application/use-cases/ListAdminUsers";
import { UpdateAdminUser } from "@/features/admin/application/use-cases/UpdateAdminUser";
import { LaravelAdminDashboardRepository } from "@/features/admin/infrastructure/http/LaravelAdminDashboardRepository";

const repository = new LaravelAdminDashboardRepository();

export const getAdminDashboard = new GetAdminDashboard(repository);
export const listAdminUsers = new ListAdminUsers(repository);
export const updateAdminUser = new UpdateAdminUser(repository);
