"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitJobApplicationInput } from "@/features/applications/application/dto/JobApplicationInput";
import { JobApplicationRequestError } from "@/features/applications/application/errors/JobApplicationRequestError";
import {
  jobApplicationSchema,
  type JobApplicationFormValues,
} from "@/features/applications/presentation/schemas/jobApplicationSchema";

interface JobApplicationFormProps {
  onSubmit: (values: SubmitJobApplicationInput) => Promise<void>;
}

export function JobApplicationForm({ onSubmit }: JobApplicationFormProps) {
  const [requestError, setRequestError] = useState<string | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JobApplicationFormValues>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: { coverLetter: "" },
  });

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    try {
      if (resumeError) return;

      await onSubmit({
        ...values,
        resume: resume
          ? {
              fileName: resume.name,
              mimeType: resume.type,
              size: resume.size,
              bytes: await resume.arrayBuffer(),
            }
          : undefined,
      });
    } catch (error) {
      if (error instanceof JobApplicationRequestError) {
        const coverLetterError = error.fieldErrors.coverLetter?.[0];
        if (coverLetterError) setError("coverLetter", { type: "server", message: coverLetterError });
        const serverResumeError = error.fieldErrors.resume?.[0];
        if (serverResumeError) setResumeError(serverResumeError);
        setRequestError(error.message);
        return;
      }
      setRequestError("Your application could not be submitted. Please try again.");
    }
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {requestError ? (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {requestError}
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-bold text-slate-800">Cover letter</span>
        <textarea
          {...register("coverLetter")}
          className="mt-2 min-h-48 w-full resize-y rounded-md border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          placeholder="Explain why your experience fits this role."
        />
        <span className="mt-1 block text-xs text-slate-500">50–5,000 characters</span>
        {errors.coverLetter ? (
          <span className="mt-1 block text-sm text-rose-600">{errors.coverLetter.message}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-sm font-bold text-slate-800">Resume PDF</span>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setResume(file);
            setResumeError(null);

            if (file && (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf"))) {
              setResumeError("Resume must be a PDF file.");
            } else if (file && file.size > 5 * 1024 * 1024) {
              setResumeError("Resume cannot exceed 5 MB.");
            }
          }}
          className="mt-2 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700"
        />
        <span className="mt-1 block text-xs text-slate-500">Optional, PDF only, maximum 5 MB</span>
        {resumeError ? <span className="mt-1 block text-sm text-rose-600">{resumeError}</span> : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
