import type { AuthRepository } from "@/features/auth/application/ports/AuthRepository";

export class LogoutUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<void> {
    return this.authRepository.logout();
  }
}
