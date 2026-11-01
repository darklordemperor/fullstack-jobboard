import axios from "axios";
import type {
  LoginCredentials,
  RegisterUserData,
  UpdateProfileData,
} from "@/features/auth/application/dto/AuthCredentials";
import { AuthRequestError } from "@/features/auth/application/errors/AuthRequestError";
import type { AuthRepository } from "@/features/auth/application/ports/AuthRepository";
import type { User } from "@/features/auth/domain/entities/User";
import { apiClient } from "@/infrastructure/http/apiClient";
import type { components } from "@/infrastructure/http/generated/openapi";

type LaravelErrorResponse = components["schemas"]["ErrorEnvelope"];
type LaravelUser = components["schemas"]["User"];
type LaravelUserEnvelope = components["schemas"]["UserEnvelope"];
type LoginRequest = components["schemas"]["LoginRequest"];
type RegisterRequest = components["schemas"]["RegisterRequest"];
type UpdateProfileRequest = components["schemas"]["UpdateProfileRequest"];

export class LaravelAuthRepository implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<User> {
    return this.execute(async () => {
      await this.getCsrfCookie();
      const payload: LoginRequest = credentials;
      const response = await apiClient.post<LaravelUserEnvelope>(
        "/api/v1/auth/login",
        payload,
      );

      return this.toEntity(response.data.data);
    });
  }

  async register(data: RegisterUserData): Promise<User> {
    return this.execute(async () => {
      await this.getCsrfCookie();
      const payload: RegisterRequest = {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.passwordConfirmation,
        role: data.role,
      };
      const response = await apiClient.post<LaravelUserEnvelope>(
        "/api/v1/auth/register",
        payload,
      );

      return this.toEntity(response.data.data);
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.execute(async () => {
      const response = await apiClient.get<LaravelUserEnvelope>("/api/v1/auth/me");

      return this.toEntity(response.data.data);
    });
  }

  async updateProfile(data: UpdateProfileData): Promise<User> {
    return this.execute(async () => {
      await this.getCsrfCookie();
      const payload: UpdateProfileRequest = {
        name: data.name,
        email: data.email,
        ...(data.currentPassword ? { currentPassword: data.currentPassword } : {}),
        ...(data.newPassword ? { newPassword: data.newPassword } : {}),
        ...(data.newPasswordConfirmation
          ? { newPassword_confirmation: data.newPasswordConfirmation }
          : {}),
      };
      const response = await apiClient.patch<LaravelUserEnvelope>(
        "/api/v1/auth/profile",
        payload,
      );

      return this.toEntity(response.data.data);
    });
  }

  async logout(): Promise<void> {
    await this.execute(async () => {
      await apiClient.post("/api/v1/auth/logout");
    });
  }

  private async getCsrfCookie(): Promise<void> {
    await apiClient.get("/sanctum/csrf-cookie");
  }

  private toEntity(user: LaravelUser): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (axios.isAxiosError<LaravelErrorResponse>(error)) {
        throw new AuthRequestError(
          error.response?.data.message ?? error.message ?? "Authentication request failed.",
          error.response?.status,
          error.response?.data.errors ?? {},
        );
      }

      throw error;
    }
  }
}
