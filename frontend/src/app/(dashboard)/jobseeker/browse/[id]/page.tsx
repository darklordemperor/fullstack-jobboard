"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getResumeDownloadUrl,
  submitJobApplication,
} from "@/features/applications/composition/applicationDependencies";
import type { JobApplicationStatus } from "@/features/applications/domain/entities/JobApplication";
import { JobApplicationForm } from "@/features/applications/presentation/components/JobApplicationForm";
import { useJobseekerApplicationsStore } from "@/features/applications/presentation/store/jobseekerApplicationsStore";
import { getJobListing } from "@/features/jobs/composition/jobDependencies";
import type {
  EmploymentType,
  JobListingDetails,
} from "@/features/jobs/domain/entities/JobListing";
import { useSavedJobsStore } from "@/features/jobs/presentation/store/savedJobsStore";

const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  remote: "Remote",
};

const applicationStatusLabels: Record<JobApplicationStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

function formatSalary(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function JobListingDetailsPage() {
  const params = useParams<{ id: string }>();
  const jobListingId = Number(params.id);
  const [jobListing, setJobListing] = useState<JobListingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmittedApplication, setHasSubmittedApplication] = useState(false);
  const savedJobIds = useSavedJobsStore((state) => state.savedJobIds);
  const pendingJobIds = useSavedJobsStore((state) => state.pendingJobIds);
  const loadSavedJobs = useSavedJobsStore((state) => state.loadSavedJobs);
  const toggleSavedJob = useSavedJobsStore((state) => state.toggleSavedJob);
  const existingApplication = useJobseekerApplicationsStore(
    (state) => state.applicationsByJobId[jobListingId] ?? null,
  );
  const loadApplicationForJob = useJobseekerApplicationsStore(
    (state) => state.loadApplicationForJob,
  );
  const recordApplication = useJobseekerApplicationsStore(
    (state) => state.recordApplication,
  );

  useEffect(() => {
    void loadSavedJobs();
  }, [loadSavedJobs]);

  useEffect(() => {
    void loadApplicationForJob(jobListingId);
  }, [jobListingId, loadApplicationForJob]);

  useEffect(() => {
    let isCurrentRequest = true;

    getJobListing
      .execute(jobListingId)
      .then((response) => {
        if (isCurrentRequest) {
          setJobListing(response);
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setError("This job listing is unavailable or is no longer published.");
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [jobListingId]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/jobseeker/browse"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <span aria-hidden="true">←</span>
          Back to job search
        </Link>

        {isLoading ? (
          <div className="mt-6 animate-pulse space-y-5 rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="h-8 w-2/3 rounded bg-slate-200" />
            <div className="h-5 w-1/3 rounded bg-slate-100" />
            <div className="h-36 rounded bg-slate-100" />
          </div>
        ) : error || !jobListing ? (
          <section className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-10 text-center">
            <h1 className="text-2xl font-bold text-rose-950">Job listing unavailable</h1>
            <p className="mt-3 text-sm text-rose-700">{error}</p>
            <Link
              href="/jobseeker/browse"
              className="mt-6 inline-flex rounded-md bg-rose-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-800"
            >
              Browse available roles
            </Link>
          </section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {employmentTypeLabels[jobListing.employmentType]}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {jobListing.category}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {jobListing.location}
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {jobListing.title}
              </h1>
              <p className="mt-2 text-lg font-semibold text-slate-600">
                {jobListing.employerName}
              </p>

              <div className="mt-7 border-t border-slate-100 pt-7">
                <h2 className="text-xl font-bold text-slate-950">About this role</h2>
                <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">
                  {jobListing.description}
                </p>
              </div>
            </article>

            <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monthly salary
              </p>
              <p className="mt-2 text-xl font-bold text-slate-950">
                {formatSalary(jobListing.salary.minimum, jobListing.salary.currency)} -{" "}
                {formatSalary(jobListing.salary.maximum, jobListing.salary.currency)}
              </p>

              <button
                type="button"
                disabled={pendingJobIds.includes(jobListing.id)}
                aria-pressed={savedJobIds.includes(jobListing.id)}
                onClick={() => void toggleSavedJob(jobListing.id)}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 ${
                  savedJobIds.includes(jobListing.id)
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                }`}
              >
                {savedJobIds.includes(jobListing.id) ? "Saved job" : "Save job"}
              </button>

              <dl className="mt-6 space-y-4 border-t border-slate-100 pt-6 text-sm">
                <div>
                  <dt className="font-semibold text-slate-500">Location</dt>
                  <dd className="mt-1 font-bold text-slate-900">{jobListing.location}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Employment type</dt>
                  <dd className="mt-1 font-bold text-slate-900">
                    {employmentTypeLabels[jobListing.employmentType]}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Published</dt>
                  <dd className="mt-1 font-bold text-slate-900">
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                      new Date(jobListing.publishedAt),
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 border-t border-slate-100 pt-6">
                {hasSubmittedApplication || existingApplication ? (
                  <div
                    role="status"
                    className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">
                        {hasSubmittedApplication
                          ? "Application submitted"
                          : "Application on file"}
                      </p>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                        {existingApplication
                          ? applicationStatusLabels[existingApplication.status]
                          : "Submitted"}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-800">
                      {hasSubmittedApplication
                        ? "The employer can now review your cover letter."
                        : "You have already applied to this role. Track updates or manage your application from your candidate history."}
                    </p>
                    <div className="flex flex-col gap-2 pt-1 text-xs font-bold">
                      <Link
                        href="/jobseeker/applications"
                        className="text-emerald-800 underline hover:text-emerald-950"
                      >
                        View in my applications →
                      </Link>
                      {existingApplication?.resume.available && (
                        <a
                          href={getResumeDownloadUrl.execute(existingApplication.id)}
                          className="text-slate-700 underline hover:text-slate-950"
                        >
                          Download submitted resume
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-slate-950">Apply for this role</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Introduce your relevant experience and interest in the position.
                    </p>
                    <div className="mt-4">
                      <JobApplicationForm
                        onSubmit={async (values) => {
                          const created = await submitJobApplication.execute(
                            jobListing.id,
                            values,
                          );
                          recordApplication(created);
                          setHasSubmittedApplication(true);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
