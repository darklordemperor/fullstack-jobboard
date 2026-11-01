import type { AuthRepository } from "@/features/auth/application/ports/AuthRepository";
import type { User } from "@/features/auth/domain/entities/User";

export class GetCurrentUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<User> {
    return this.authRepository.getCurrentUser();
  }
}
