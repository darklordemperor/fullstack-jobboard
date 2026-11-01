import type {
  LoginCredentials,
  RegisterUserData,
  UpdateProfileData,
} from "@/features/auth/application/dto/AuthCredentials";
import type { User } from "@/features/auth/domain/entities/User";

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<User>;
  register(data: RegisterUserData): Promise<User>;
  getCurrentUser(): Promise<User>;
  updateProfile(data: UpdateProfileData): Promise<User>;
  logout(): Promise<void>;
}
