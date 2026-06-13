"use client";

import { useEffect, useState } from "react";
import {
  APP_TOAST_EVENT,
  AUTH_UNAUTHORIZED_EVENT,
  type ToastPayload,
} from "@/lib/client-events";
import { useAuthStore } from "@/store/authStore";

interface ToastState extends Required<ToastPayload> {
  id: number;
}

export function ClientEventBridge() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    function handleUnauthorized() {
      useAuthStore.getState().clearAuth();
    }

    function handleToast(event: Event) {
      const payload = (event as CustomEvent<ToastPayload>).detail;

      setToast({
        id: Date.now(),
        message: payload.message,
        variant: payload.variant ?? "info",
      });
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener(APP_TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
      window.removeEventListener(APP_TOAST_EVENT, handleToast);
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-md border border-red-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-lg">
      <p className="font-semibold">
        {toast.variant === "error" ? "Request failed" : "Notification"}
      </p>
      <p className="mt-1 text-slate-600">{toast.message}</p>
    </div>
  );
}
