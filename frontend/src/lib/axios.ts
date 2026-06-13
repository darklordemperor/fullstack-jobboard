"use client";

import axios, { AxiosError } from "axios";
import { emitAuthUnauthorized, emitToast } from "@/lib/client-events";
import type { LaravelValidationError, ValidationErrors } from "@/types/api.types";

export const api = axios.create({
  baseURL: "/",
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<LaravelValidationError>) => {
    const status = error.response?.status;

    if (status === 401 && typeof window !== "undefined") {
      emitAuthUnauthorized();

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    if (status === 422) {
      return Promise.reject(
        Object.assign(error, {
          fieldErrors: error.response?.data.errors ?? {},
        }),
      );
    }

    if (status && status >= 500) {
      emitToast({
        message: "Server error. Please try again in a moment.",
        variant: "error",
      });
    }

    return Promise.reject(error);
  },
);

export function getValidationErrors(error: unknown): ValidationErrors {
  if (axios.isAxiosError<LaravelValidationError>(error) && "fieldErrors" in error) {
    return (error as AxiosError<LaravelValidationError> & { fieldErrors: ValidationErrors })
      .fieldErrors;
  }

  if (axios.isAxiosError<LaravelValidationError>(error)) {
    return error.response?.status === 422 ? error.response.data.errors : {};
  }

  return {};
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (axios.isAxiosError<LaravelValidationError>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }

  return fallback;
}

export default api;
