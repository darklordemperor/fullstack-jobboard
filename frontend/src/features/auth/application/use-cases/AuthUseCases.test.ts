import { describe, expect, it } from "vitest";
import type {
  LoginCredentials,
  RegisterUserData,
  UpdateProfileData,
} from "@/features/auth/application/dto/AuthCredentials";
import type { AuthRepository } from "@/features/auth/application/ports/AuthRepository";
import { GetCurrentUser } from "@/features/auth/application/use-cases/GetCurrentUser";
import { LoginUser } from "@/features/auth/application/use-cases/LoginUser";
import { LogoutUser } from "@/features/auth/application/use-cases/LogoutUser";
import { RegisterUser } from "@/features/auth/application/use-cases/RegisterUser";
import { UpdateProfile } from "@/features/auth/application/use-cases/UpdateProfile";
import type { User } from "@/features/auth/domain/entities/User";

const employer: User = {
  id: 7,
  name: "Employer User",
  email: "employer@example.com",
  role: "employer",
  createdAt: "2026-10-29T00:00:00.000000Z",
};

class FakeAuthRepository implements AuthRepository {
  loginInput?: LoginCredentials;
  registerInput?: RegisterUserData;
  updateProfileInput?: UpdateProfileData;
  logoutCount = 0;

  async login(credentials: LoginCredentials): Promise<User> {
    this.loginInput = credentials;
    return employer;
  }

  async register(data: RegisterUserData): Promise<User> {
    this.registerInput = data;
    return employer;
  }

  async getCurrentUser(): Promise<User> {
    return employer;
  }

  async updateProfile(data: UpdateProfileData): Promise<User> {
    this.updateProfileInput = data;
    return {
      ...employer,
      name: data.name,
      email: data.email,
    };
  }

  async logout(): Promise<void> {
    this.logoutCount += 1;
  }
}

describe("auth use cases", () => {
  it("passes login credentials through the repository port", async () => {
    const repository = new FakeAuthRepository();
    const useCase = new LoginUser(repository);

    await expect(
      useCase.execute({ email: "employer@example.com", password: "password" }),
    ).resolves.toEqual(employer);
    expect(repository.loginInput).toEqual({
      email: "employer@example.com",
      password: "password",
    });
  });

  it("passes registration data through the repository port", async () => {
    const repository = new FakeAuthRepository();
    const useCase = new RegisterUser(repository);
    const data: RegisterUserData = {
      name: "Employer User",
      email: "employer@example.com",
      password: "password",
      passwordConfirmation: "password",
      role: "employer",
    };

    await expect(useCase.execute(data)).resolves.toEqual(employer);
    expect(repository.registerInput).toEqual(data);
  });

  it("retrieves the current user through the repository port", async () => {
    await expect(new GetCurrentUser(new FakeAuthRepository()).execute()).resolves.toEqual(employer);
  });

  it("logs out through the repository port", async () => {
    const repository = new FakeAuthRepository();

    await new LogoutUser(repository).execute();

    expect(repository.logoutCount).toBe(1);
  });

  it("updates account profile through the repository port", async () => {
    const repository = new FakeAuthRepository();
    const useCase = new UpdateProfile(repository);

    const updated = await useCase.execute({
      name: "Updated Employer",
      email: "updated@example.com",
      currentPassword: "password",
      newPassword: "NewSecret123!",
      newPasswordConfirmation: "NewSecret123!",
    });

    expect(updated.name).toBe("Updated Employer");
    expect(updated.email).toBe("updated@example.com");
    expect(repository.updateProfileInput).toEqual({
      name: "Updated Employer",
      email: "updated@example.com",
      currentPassword: "password",
      newPassword: "NewSecret123!",
      newPasswordConfirmation: "NewSecret123!",
    });
  });
});
