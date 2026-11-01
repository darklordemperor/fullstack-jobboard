"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EmployerJobRequestError } from "@/features/employer/application/errors/EmployerJobRequestError";
import {
  employerJobSchema,
  type EmployerJobFormValues,
} from "@/features/employer/presentation/schemas/employerJobSchema";

interface EmployerJobFormProps {
  defaultValues?: EmployerJobFormValues;
  submitLabel: string;
  onSubmit: (values: EmployerJobFormValues) => Promise<void>;
}

const emptyValues: EmployerJobFormValues = {
  title: "",
  description: "",
  location: "",
  employmentType: "full_time",
  category: "",
  salaryMinimum: 0,
  salaryMaximum: 0,
};

const fieldNames = new Set<keyof EmployerJobFormValues>([
  "title",
  "description",
  "location",
  "employmentType",
  "category",
  "salaryMinimum",
  "salaryMaximum",
]);

function isFieldName(value: string): value is keyof EmployerJobFormValues {
  return fieldNames.has(value as keyof EmployerJobFormValues);
}

export function EmployerJobForm({
  defaultValues = emptyValues,
  submitLabel,
  onSubmit,
}: EmployerJobFormProps) {
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployerJobFormValues>({
    resolver: zodResolver(employerJobSchema),
    defaultValues,
  });

  const submit = handleSubmit(async (values) => {
    setRequestError(null);

    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof EmployerJobRequestError) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          if (isFieldName(field) && messages[0]) {
            setError(field, { type: "server", message: messages[0] });
          }
        });
        setRequestError(error.message);
        return;
      }

      setRequestError("The job listing could not be saved. Please try again.");
    }
  });

  const inputClassName =
    "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {requestError ? (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {requestError}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold text-slate-800">Job title</span>
          <input {...register("title")} className={inputClassName} placeholder="Senior Backend Engineer" />
          {errors.title ? <span className="mt-1 block text-sm text-rose-600">{errors.title.message}</span> : null}
        </label>

        <label>
          <span className="text-sm font-semibold text-slate-800">Location</span>
          <input {...register("location")} className={inputClassName} placeholder="Bangkok or Remote" />
          {errors.location ? <span className="mt-1 block text-sm text-rose-600">{errors.location.message}</span> : null}
        </label>

        <label>
          <span className="text-sm font-semibold text-slate-800">Category</span>
          <input {...register("category")} className={inputClassName} placeholder="IT" />
          {errors.category ? <span className="mt-1 block text-sm text-rose-600">{errors.category.message}</span> : null}
        </label>

        <label>
          <span className="text-sm font-semibold text-slate-800">Employment type</span>
          <select {...register("employmentType")} className={inputClassName}>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="remote">Remote</option>
          </select>
          {errors.employmentType ? <span className="mt-1 block text-sm text-rose-600">{errors.employmentType.message}</span> : null}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="text-sm font-semibold text-slate-800">Minimum salary</span>
            <input
              {...register("salaryMinimum", { valueAsNumber: true })}
              className={inputClassName}
              min="0"
              step="1000"
              type="number"
            />
            {errors.salaryMinimum ? <span className="mt-1 block text-sm text-rose-600">{errors.salaryMinimum.message}</span> : null}
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-800">Maximum salary</span>
            <input
              {...register("salaryMaximum", { valueAsNumber: true })}
              className={inputClassName}
              min="0"
              step="1000"
              type="number"
            />
            {errors.salaryMaximum ? <span className="mt-1 block text-sm text-rose-600">{errors.salaryMaximum.message}</span> : null}
          </label>
        </div>

        <label className="sm:col-span-2">
          <span className="text-sm font-semibold text-slate-800">Description</span>
          <textarea
            {...register("description")}
            className={`${inputClassName} min-h-52 resize-y`}
            placeholder="Describe responsibilities, requirements, and the team."
          />
          <div className="mt-1 flex justify-between gap-3 text-sm">
            <span className="text-rose-600">{errors.description?.message}</span>
            <span className="text-slate-400">Minimum 50 characters</span>
          </div>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
