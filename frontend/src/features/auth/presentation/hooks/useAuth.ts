"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/features/auth/presentation/store/authStore";

export interface UseAuthOptions {
  autoLoad?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { autoLoad = false } = options;
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const loginWithStore = useAuthStore((state) => state.login);
  const registerWithStore = useAuthStore((state) => state.register);
  const updateProfileWithStore = useAuthStore((state) => state.updateProfile);
  const logoutFromStore = useAuthStore((state) => state.logout);
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    if (autoLoad && status === "idle") {
      void loadUser();
    }
  }, [autoLoad, loadUser, status]);

  const login = useCallback(
    (email: string, password: string) => loginWithStore({ email, password }),
    [loginWithStore],
  );

  const logout = useCallback(() => logoutFromStore(), [logoutFromStore]);

  const register = useCallback(
    (data: Parameters<typeof registerWithStore>[0]) => registerWithStore(data),
    [registerWithStore],
  );

  const updateProfile = useCallback(
    (data: Parameters<typeof updateProfileWithStore>[0]) =>
      updateProfileWithStore(data),
    [updateProfileWithStore],
  );

  return {
    user,
    status,
    login,
    register,
    updateProfile,
    logout,
    loadUser,
    isLoggingOut,
    isLoading: status === "idle" || status === "loading",
    isUnavailable: status === "unavailable",
  };
}
