"use client";

export const AUTH_UNAUTHORIZED_EVENT = "job-board:auth-unauthorized";
export const APP_TOAST_EVENT = "job-board:toast";

export type ToastVariant = "error" | "success" | "info";

export interface ToastPayload {
  message: string;
  variant?: ToastVariant;
}

export function emitAuthUnauthorized() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}

export function emitToast(payload: ToastPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<ToastPayload>(APP_TOAST_EVENT, { detail: payload }));
}
