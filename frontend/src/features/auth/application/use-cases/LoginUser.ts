import type { LoginCredentials } from "@/features/auth/application/dto/AuthCredentials";
import type { AuthRepository } from "@/features/auth/application/ports/AuthRepository";
import type { User } from "@/features/auth/domain/entities/User";

export class LoginUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(credentials: LoginCredentials): Promise<User> {
    return this.authRepository.login(credentials);
  }
}
