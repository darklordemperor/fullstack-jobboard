"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { AuthRequestError } from "@/features/auth/application/errors/AuthRequestError";
import { getDefaultDashboardPath } from "@/features/auth/domain/navigation/roleNavigation";
import { useAuth } from "@/features/auth/presentation/hooks/useAuth";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/presentation/schemas/registerSchema";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAccount } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "jobseeker",
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const user = await registerAccount(values);
      router.replace(getDefaultDashboardPath(user.role));
      router.refresh();
    } catch (error) {
      const fieldErrors = error instanceof AuthRequestError ? error.fieldErrors : {};

      Object.entries(fieldErrors).forEach(([field, messages]) => {
        const formField = field === "password_confirmation" ? "passwordConfirmation" : field;

        if (
          formField === "name" ||
          formField === "email" ||
          formField === "role" ||
          formField === "password" ||
          formField === "passwordConfirmation"
        ) {
          setError(formField, { message: messages[0] });
        }
      });

      setFormError(
        error instanceof AuthRequestError ? error.message : "Unable to create your account.",
      );
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-6 py-12 text-slate-950">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-slate-950 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">Job Board</p>
            <h1 className="mt-8 max-w-sm text-4xl font-semibold leading-tight">
              Create a focused workspace for your next hire or career move.
            </h1>
          </div>
          <p className="text-sm leading-6 text-slate-300">
            Choose the account role that matches how you will use the platform.
          </p>
        </div>

        <div className="px-6 py-8 sm:px-10 md:px-12 md:py-12">
          <div className="mb-7">
            <p className="text-sm font-medium text-emerald-700">Get started</p>
            <h2 className="mt-2 text-3xl font-semibold">Create account</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Registration starts a secure Sanctum session immediately.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={onSubmit} noValidate>
            <FormField label="Name" error={errors.name?.message}>
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                type="text"
                autoComplete="name"
                {...register("name")}
              />
            </FormField>

            <FormField label="Email" error={errors.email?.message}>
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
            </FormField>

            <FormField label="Account role" error={errors.role?.message}>
              <select
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                {...register("role")}
              >
                <option value="jobseeker">Jobseeker</option>
                <option value="employer">Employer</option>
              </select>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Password" error={errors.password?.message}>
                <input
                  className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                />
              </FormField>
              <FormField label="Confirm password" error={errors.passwordConfirmation?.message}>
                <input
                  className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  type="password"
                  autoComplete="new-password"
                  {...register("passwordConfirmation")}
                />
              </FormField>
            </div>

            {formError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            <button
              className="mt-1 flex h-11 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-7 text-sm text-slate-600">
            Already registered?{" "}
            <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/login">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function FormField({ children, error, label }: { children: ReactNode; error?: string; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}
      {children}
      {error ? <span className="font-normal text-red-600">{error}</span> : null}
    </label>
  );
}
