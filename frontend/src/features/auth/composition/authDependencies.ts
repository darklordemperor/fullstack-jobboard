import { GetCurrentUser } from "@/features/auth/application/use-cases/GetCurrentUser";
import { LoginUser } from "@/features/auth/application/use-cases/LoginUser";
import { LogoutUser } from "@/features/auth/application/use-cases/LogoutUser";
import { RegisterUser } from "@/features/auth/application/use-cases/RegisterUser";
import { UpdateProfile } from "@/features/auth/application/use-cases/UpdateProfile";
import { LaravelAuthRepository } from "@/features/auth/infrastructure/http/LaravelAuthRepository";

const authRepository = new LaravelAuthRepository();

export const authUseCases = {
  loginUser: new LoginUser(authRepository),
  registerUser: new RegisterUser(authRepository),
  getCurrentUser: new GetCurrentUser(authRepository),
  updateProfile: new UpdateProfile(authRepository),
  logoutUser: new LogoutUser(authRepository),
};
