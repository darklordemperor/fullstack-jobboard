"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getEmployerJob, updateEmployerJob } from "@/features/employer/composition/employerDependencies";
import type { EmployerJobListingDetails } from "@/features/employer/domain/entities/EmployerJobListing";
import { EmployerJobForm } from "@/features/employer/presentation/components/EmployerJobForm";

function LoadingPanel() {
  return (
    <div aria-label="Loading job listing" className="space-y-4 rounded-xl border border-slate-200 bg-white p-8">
      <div className="h-8 w-2/5 animate-pulse rounded bg-slate-100" />
      <div className="h-72 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

export default function EditEmployerJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<EmployerJobListingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = Number(params.id);

  useEffect(() => {
    let active = true;

    getEmployerJob
      .execute(id)
      .then((response) => {
        if (active) setJob(response);
      })
      .catch(() => {
        if (active) setError("The job listing could not be loaded or you do not have access to it.");
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/employer/jobs" className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
          ← Back to job listings
        </Link>

        <header className="my-5">
          <p className="text-sm font-semibold text-emerald-700">Employer Portal</p>
          <h1 className="mt-1 text-3xl font-bold">Edit job listing</h1>
          <p className="mt-2 text-sm text-slate-500">Changes preserve the current publication state.</p>
        </header>

        {!job && !error ? <LoadingPanel /> : null}

        {error ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            <p className="font-bold">Unable to open this listing</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : null}

        {job?.status === "closed" ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-bold">This job listing is closed</p>
            <p className="mt-2 text-sm">Closed listings are retained for history and cannot be edited.</p>
          </div>
        ) : null}

        {job && job.status !== "closed" ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <EmployerJobForm
              submitLabel="Save changes"
              defaultValues={{
                title: job.title,
                description: job.description,
                location: job.location,
                employmentType: job.employmentType,
                category: job.category,
                salaryMinimum: job.salary.minimum,
                salaryMaximum: job.salary.maximum,
              }}
              onSubmit={async (values) => {
                await updateEmployerJob.execute(job.id, values);
                router.replace("/employer/jobs");
              }}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
