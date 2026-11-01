"use client";

import { create } from "zustand";
import type {
  LoginCredentials,
  RegisterUserData,
  UpdateProfileData,
} from "@/features/auth/application/dto/AuthCredentials";
import { AuthRequestError } from "@/features/auth/application/errors/AuthRequestError";
import { authUseCases } from "@/features/auth/composition/authDependencies";
import type { User } from "@/features/auth/domain/entities/User";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "guest"
  | "unavailable";

export interface AuthUseCasePort {
  loginUser: { execute: (credentials: LoginCredentials) => Promise<User> };
  registerUser: { execute: (data: RegisterUserData) => Promise<User> };
  getCurrentUser: { execute: () => Promise<User> };
  updateProfile: { execute: (data: UpdateProfileData) => Promise<User> };
  logoutUser: { execute: () => Promise<void> };
}

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  isLoggingOut: boolean;
  clearAuth: () => void;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterUserData) => Promise<User>;
  loadUser: () => Promise<User | null>;
  updateProfile: (data: UpdateProfileData) => Promise<User>;
  logout: () => Promise<void>;
}

export function createAuthStore(useCases: AuthUseCasePort = authUseCases) {
  let inflightLoadUser: Promise<User | null> | null = null;

  return create<AuthState>((set) => ({
    user: null,
    status: "idle",
    isLoggingOut: false,

    clearAuth: () => set({ user: null, status: "guest", isLoggingOut: false }),

    login: async (credentials) => {
      set({ status: "loading" });

      try {
        const user = await useCases.loginUser.execute(credentials);
        set({ user, status: "authenticated", isLoggingOut: false });
        return user;
      } catch (error) {
        set({ user: null, status: "guest" });
        throw error;
      }
    },

    register: async (data) => {
      set({ status: "loading" });

      try {
        const user = await useCases.registerUser.execute(data);
        set({ user, status: "authenticated", isLoggingOut: false });
        return user;
      } catch (error) {
        set({ user: null, status: "guest" });
        throw error;
      }
    },

    loadUser: async () => {
      if (inflightLoadUser) {
        return inflightLoadUser;
      }

      set({ status: "loading" });

      inflightLoadUser = useCases.getCurrentUser
        .execute()
        .then((user) => {
          set({ user, status: "authenticated" });
          return user;
        })
        .catch((error: unknown) => {
          const isUnauthenticated =
            error instanceof AuthRequestError && error.status === 401;
          set({
            user: null,
            status: isUnauthenticated ? "guest" : "unavailable",
          });
          return null;
        })
        .finally(() => {
          inflightLoadUser = null;
        });

      return inflightLoadUser;
    },

    updateProfile: async (data) => {
      const user = await useCases.updateProfile.execute(data);
      set({ user, status: "authenticated" });
      return user;
    },

    logout: async () => {
      set({ isLoggingOut: true });

      try {
        await useCases.logoutUser.execute();
      } finally {
        set({ user: null, status: "guest", isLoggingOut: false });
      }
    },
  }));
}

export const useAuthStore = createAuthStore();
