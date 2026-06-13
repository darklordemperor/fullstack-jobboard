"use client";

import { create } from "zustand";
import * as authApi from "@/lib/auth";
import type { LoginCredentials, User } from "@/types/api.types";

export type AuthStatus = "idle" | "loading" | "authenticated" | "guest";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  clearAuth: () => void;
  setUser: (user: User | null) => void;
  login: (credentials: LoginCredentials) => Promise<User>;
  loadUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  clearAuth: () => {
    set({ user: null, status: "guest" });
  },

  setUser: (user) => {
    set({ user, status: user ? "authenticated" : "guest" });
  },

  login: async (credentials) => {
    set({ status: "loading" });

    try {
      const user = await authApi.login(credentials);
      set({ user, status: "authenticated" });
      return user;
    } catch (error) {
      set({ user: null, status: "guest" });
      throw error;
    }
  },

  loadUser: async () => {
    set({ status: "loading" });

    try {
      const user = await authApi.getCurrentUser();
      set({ user, status: "authenticated" });
      return user;
    } catch {
      set({ user: null, status: "guest" });
      return null;
    }
  },

  logout: async () => {
    set({ status: "loading" });

    try {
      await authApi.logout();
    } finally {
      set({ user: null, status: "guest" });
    }
  },
}));
