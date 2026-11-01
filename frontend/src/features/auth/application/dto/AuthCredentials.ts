import type { UserRole } from "@/features/auth/domain/entities/User";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData extends LoginCredentials {
  name: string;
  passwordConfirmation: string;
  role: Exclude<UserRole, "admin">;
}

export interface UpdateProfileData {
  name: string;
  email: string;
  currentPassword?: string | null;
  newPassword?: string | null;
  newPasswordConfirmation?: string | null;
}
