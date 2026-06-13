"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import type { LoginCredentials } from "@/types/api.types";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const loginWithStore = useAuthStore((state) => state.login);
  const logoutFromStore = useAuthStore((state) => state.logout);
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    if (status === "idle") {
      void loadUser();
    }
  }, [loadUser, status]);

  const login = useCallback(
    (email: string, password: string) => {
      const credentials: LoginCredentials = { email, password };
      return loginWithStore(credentials);
    },
    [loginWithStore],
  );

  const logout = useCallback(() => logoutFromStore(), [logoutFromStore]);

  return {
    user,
    login,
    logout,
    isLoading: status === "idle" || status === "loading",
  };
}
