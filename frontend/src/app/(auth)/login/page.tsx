"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage, getValidationErrors } from "@/lib/axios";
import type { UserRole } from "@/types/api.types";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const roleRedirects: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  employer: "/employer/jobs",
  jobseeker: "/jobseeker/browse",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const user = await login(values.email, values.password);

      const nextUrl = new URLSearchParams(window.location.search).get("next");
      const redirectTo = nextUrl ?? roleRedirects[user.role];

      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      const validationErrors = getValidationErrors(error);

      Object.entries(validationErrors).forEach(([field, messages]) => {
        if (field === "email" || field === "password") {
          setError(field, { message: messages[0] });
        }
      });

      setFormError(getErrorMessage(error, "Unable to sign in with those credentials."));
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-6 py-12 text-slate-950">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-slate-950 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">Job Board</p>
            <h1 className="mt-8 max-w-sm text-4xl font-semibold leading-tight">
              Hire faster, search smarter, and keep every application moving.
            </h1>
          </div>
          <div className="grid gap-4 text-sm text-slate-300">
            <p>Sanctum session auth</p>
            <p>Employer and jobseeker dashboards</p>
            <p>Laravel REST API ready</p>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 md:px-12 md:py-14">
          <div className="mb-8">
            <p className="text-sm font-medium text-emerald-700">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Sign in</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use your Laravel account credentials to continue.
            </p>
          </div>

          <form className="grid gap-5" onSubmit={onSubmit} noValidate>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-800" htmlFor="email">
                Email
              </label>
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email?.message ? (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-800" htmlFor="password">
                Password
              </label>
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password?.message ? (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              ) : null}
            </div>

            {formError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            <button
              className="flex h-11 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-600">
            Need an account?{" "}
            <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/register">
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
