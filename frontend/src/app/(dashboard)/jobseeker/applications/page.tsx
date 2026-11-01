"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmActionDialog } from "@/components/ui/ConfirmActionDialog";
import {
  getResumeDownloadUrl,
  listJobseekerApplications,
  withdrawJobApplication,
} from "@/features/applications/composition/applicationDependencies";
import type {
  JobApplication,
  JobApplicationPage,
  JobApplicationStatus,
} from "@/features/applications/domain/entities/JobApplication";
import { useJobseekerApplicationsStore } from "@/features/applications/presentation/store/jobseekerApplicationsStore";

const statusLabels: Record<JobApplicationStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

const withdrawableStatuses = new Set<JobApplicationStatus>([
  "submitted",
  "reviewing",
  "shortlisted",
]);

function statusClassName(status: JobApplicationStatus): string {
  if (status === "hired") return "bg-emerald-100 text-emerald-800";
  if (status === "shortlisted") return "bg-sky-100 text-sky-800";
  if (status === "rejected") return "bg-rose-100 text-rose-800";
  if (status === "reviewing") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export default function JobseekerApplicationsPage() {
  const [status, setStatus] = useState<JobApplicationStatus | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<JobApplicationPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [pendingWithdrawApplication, setPendingWithdrawApplication] =
    useState<JobApplication | null>(null);
  const recordApplication = useJobseekerApplicationsStore(
    (state) => state.recordApplication,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    listJobseekerApplications
      .execute({
        status,
        search: debouncedSearch || undefined,
        page,
        perPage: 10,
      })
      .then((response) => {
        if (active) {
          setResult(response);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError("Your application history could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, page, reloadToken, status]);

  const changeStatus = (nextStatus?: JobApplicationStatus): void => {
    setStatus(nextStatus);
    setPage(1);
    setIsLoading(true);
  };

  const changeSearch = (value: string): void => {
    setSearchInput(value);
    setPage(1);
    setIsLoading(true);
  };

  const withdraw = async (applicationId: number): Promise<void> => {
    setWithdrawingId(applicationId);
    setError(null);
    try {
      const updated = await withdrawJobApplication.execute(applicationId);
      recordApplication(updated);
      setIsLoading(true);
      setReloadToken((token) => token + 1);
    } catch {
      setError("The application could not be withdrawn. Refresh and try again.");
    } finally {
      setWithdrawingId(null);
    }
  };

  const counts = result?.counts ?? {
    total: 0,
    submitted: 0,
    reviewing: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
    withdrawn: 0,
  };

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Jobseeker portal</p>
            <h1 className="mt-1 text-3xl font-bold">My applications</h1>
            <p className="mt-2 text-sm text-slate-500">
              Track employer decisions, search your application history, download your submitted resume, or withdraw active applications.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="search"
                aria-label="Search application history"
                placeholder="Search job title or cover letter…"
                value={searchInput}
                onChange={(event) => changeSearch(event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:w-64"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => changeSearch("")}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <select
              aria-label="Filter application history by status"
              value={status ?? ""}
              onChange={(event) =>
                changeStatus((event.target.value || undefined) as JobApplicationStatus | undefined)
              }
              className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Link
              href="/jobseeker/interviews"
              className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              My interviews
            </Link>
            <Link
              href="/jobseeker/browse"
              className="rounded-md bg-slate-950 px-5 py-2.5 text-center text-sm font-bold text-white hover:bg-slate-800"
            >
              Browse jobs
            </Link>
          </div>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {([
            ["Total", counts.total],
            ["Submitted", counts.submitted],
            ["Reviewing", counts.reviewing],
            ["Shortlisted", counts.shortlisted],
            ["Hired", counts.hired],
            ["Closed", counts.rejected + counts.withdrawn],
          ] as const).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </div>
        ) : null}

        <section className="mt-6 space-y-4" aria-live="polite">
          {isLoading
            ? [1, 2, 3].map((item) => (
                <div key={item} className="h-44 animate-pulse rounded-xl bg-white shadow-sm" />
              ))
            : null}

          {!isLoading && result?.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <h2 className="text-xl font-bold">No applications found</h2>
              <p className="mt-2 text-sm text-slate-500">
                Apply to a published role or adjust your search and status filters.
              </p>
              <Link
                href="/jobseeker/browse"
                className="mt-5 inline-flex rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white"
              >
                Browse roles
              </Link>
            </div>
          ) : null}

          {!isLoading && result
            ? result.items.map((application) => (
                <article
                  key={application.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <Link
                        href={`/jobseeker/browse/${application.jobListing.id}`}
                        className="text-xl font-bold text-slate-950 hover:text-emerald-700"
                      >
                        {application.jobListing.title}
                      </Link>
                      <p className="mt-2 text-sm text-slate-500">
                        Applied{" "}
                        {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                          new Date(application.appliedAt),
                        )}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${statusClassName(application.status)}`}
                    >
                      {statusLabels[application.status]}
                    </span>
                  </div>

                  <p className="mt-5 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {application.coverLetter}
                  </p>

                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm">
                      {application.resume.available ? (
                        <a
                          href={getResumeDownloadUrl.execute(application.id)}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          Download {application.resume.originalName ?? "resume.pdf"}
                        </a>
                      ) : (
                        <span className="text-slate-400">No resume attached</span>
                      )}
                    </div>
                    {withdrawableStatuses.has(application.status) ? (
                      <button
                        type="button"
                        disabled={withdrawingId === application.id}
                        onClick={() => setPendingWithdrawApplication(application)}
                        className="rounded-md border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        {withdrawingId === application.id ? "Withdrawing…" : "Withdraw application"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            : null}

          {!isLoading && result && result.pagination.lastPage > 1 ? (
            <nav
              aria-label="Application history pages"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setIsLoading(true);
                  setPage((current) => Math.max(1, current - 1));
                }}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {result.pagination.currentPage} of {result.pagination.lastPage}
              </span>
              <button
                type="button"
                disabled={page >= result.pagination.lastPage}
                onClick={() => {
                  setIsLoading(true);
                  setPage((current) => current + 1);
                }}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          ) : null}
        </section>
      </div>

      <ConfirmActionDialog
        isOpen={pendingWithdrawApplication !== null}
        title="Withdraw application?"
        description={
          pendingWithdrawApplication
            ? `Withdraw your application for "${pendingWithdrawApplication.jobListing.title}"? The employer will be notified and this cannot be undone.`
            : "The employer will be notified and this cannot be undone."
        }
        confirmLabel="Withdraw application"
        onCancel={() => setPendingWithdrawApplication(null)}
        onConfirm={async () => {
          const target = pendingWithdrawApplication;
          setPendingWithdrawApplication(null);
          if (target) {
            await withdraw(target.id);
          }
        }}
      />
    </main>
  );
}
