import type { UpdateProfileData } from "@/features/auth/application/dto/AuthCredentials";
import type { AuthRepository } from "@/features/auth/application/ports/AuthRepository";
import type { User } from "@/features/auth/domain/entities/User";

export class UpdateProfile {
  constructor(private readonly repository: AuthRepository) {}

  execute(data: UpdateProfileData): Promise<User> {
    return this.repository.updateProfile(data);
  }
}
