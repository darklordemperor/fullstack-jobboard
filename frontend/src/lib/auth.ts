import api from "@/lib/axios";
import type {
  ApiResponse,
  LoginCredentials,
  RegisterPayload,
  User,
} from "@/types/api.types";

type LaravelUser = Omit<User, "createdAt"> & {
  createdAt?: string;
  created_at?: string;
};

export async function getCsrfCookie() {
  await api.get("/sanctum/csrf-cookie");
}

export async function login(credentials: LoginCredentials) {
  await getCsrfCookie();
  await api.post("/api/v1/auth/login", credentials);

  return getCurrentUser();
}

export async function register(payload: RegisterPayload) {
  await getCsrfCookie();
  await api.post("/api/v1/auth/register", payload);

  return getCurrentUser();
}

export async function getCurrentUser() {
  const response = await api.get<ApiResponse<LaravelUser> | LaravelUser>("/api/v1/auth/me");
  const user = "success" in response.data ? response.data.data : response.data;

  return {
    ...user,
    createdAt: user.createdAt ?? user.created_at ?? "",
  };
}

export async function logout() {
  await api.post("/api/v1/auth/logout");
}
