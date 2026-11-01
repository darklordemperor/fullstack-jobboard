import type { RegisterUserData } from "@/features/auth/application/dto/AuthCredentials";
import type { AuthRepository } from "@/features/auth/application/ports/AuthRepository";
import type { User } from "@/features/auth/domain/entities/User";

export class RegisterUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(data: RegisterUserData): Promise<User> {
    return this.authRepository.register(data);
  }
}
