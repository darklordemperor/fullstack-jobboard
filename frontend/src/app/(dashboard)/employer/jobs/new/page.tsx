"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createEmployerJob } from "@/features/employer/composition/employerDependencies";
import { EmployerJobForm } from "@/features/employer/presentation/components/EmployerJobForm";

export default function NewEmployerJobPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/employer/jobs" className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
          ← Back to job listings
        </Link>

        <header className="mt-5 rounded-xl bg-slate-950 px-6 py-8 text-white sm:px-8">
          <p className="text-sm font-semibold text-emerald-300">Employer Portal</p>
          <h1 className="mt-2 text-3xl font-bold">Create a job listing</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Save the opening as a draft first. You can review and publish it from the jobs dashboard.
          </p>
        </header>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <EmployerJobForm
            submitLabel="Save draft"
            onSubmit={async (values) => {
              await createEmployerJob.execute(values);
              router.replace("/employer/jobs");
            }}
          />
        </section>
      </div>
    </main>
  );
}
