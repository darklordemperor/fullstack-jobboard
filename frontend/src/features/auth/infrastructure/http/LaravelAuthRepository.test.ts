import { beforeEach, describe, expect, it, vi } from "vitest";
import { LaravelAuthRepository } from "@/features/auth/infrastructure/http/LaravelAuthRepository";
import type { components } from "@/infrastructure/http/generated/openapi";

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/infrastructure/http/apiClient", () => ({ apiClient: client }));

const user: components["schemas"]["User"] = {
  id: 7,
  name: "Employer User",
  email: "employer@example.com",
  role: "employer",
  createdAt: "2026-10-30T00:00:00.000000Z",
};

const envelope = {
  data: { success: true, data: user, message: "OK", errors: null },
};

describe("LaravelAuthRepository", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads CSRF protection and maps the generated login contract to a domain user", async () => {
    client.get.mockResolvedValueOnce({});
    client.post.mockResolvedValueOnce(envelope);

    const result = await new LaravelAuthRepository().login({
      email: "employer@example.com",
      password: "password",
    });

    expect(client.get).toHaveBeenCalledWith("/sanctum/csrf-cookie");
    expect(client.post).toHaveBeenCalledWith("/api/v1/auth/login", {
      email: "employer@example.com",
      password: "password",
    });
    expect(result).toEqual(user);
    expect(result).not.toBe(user);
  });

  it("maps the application registration DTO to the generated snake-case request", async () => {
    client.get.mockResolvedValueOnce({});
    client.post.mockResolvedValueOnce(envelope);

    await new LaravelAuthRepository().register({
      name: "Employer User",
      email: "employer@example.com",
      password: "password",
      passwordConfirmation: "password",
      role: "employer",
    });

    expect(client.post).toHaveBeenCalledWith("/api/v1/auth/register", {
      name: "Employer User",
      email: "employer@example.com",
      password: "password",
      password_confirmation: "password",
      role: "employer",
    });
  });

  it("loads CSRF protection and patches the account profile endpoint", async () => {
    client.get.mockResolvedValueOnce({});
    client.patch.mockResolvedValueOnce(envelope);

    const result = await new LaravelAuthRepository().updateProfile({
      name: "Employer User",
      email: "employer@example.com",
      currentPassword: "password",
      newPassword: "NewSecret123!",
      newPasswordConfirmation: "NewSecret123!",
    });

    expect(client.get).toHaveBeenCalledWith("/sanctum/csrf-cookie");
    expect(client.patch).toHaveBeenCalledWith("/api/v1/auth/profile", {
      name: "Employer User",
      email: "employer@example.com",
      currentPassword: "password",
      newPassword: "NewSecret123!",
      newPassword_confirmation: "NewSecret123!",
    });
    expect(result).toEqual(user);
  });
});
