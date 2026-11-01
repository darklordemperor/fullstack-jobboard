"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  listEmployerJobApplications,
  getResumeDownloadUrl,
  updateJobApplicationStatus,
} from "@/features/applications/composition/applicationDependencies";
import type {
  EmployerManagedJobApplicationStatus,
  JobApplicationPage,
  JobApplicationStatus,
} from "@/features/applications/domain/entities/JobApplication";
import { getEmployerJob } from "@/features/employer/composition/employerDependencies";
import { InterviewScheduleForm } from "@/features/interviews/presentation/components/InterviewScheduleForm";

const statusLabels: Record<JobApplicationStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

const nextStatuses: Record<JobApplicationStatus, EmployerManagedJobApplicationStatus[]> = {
  submitted: ["reviewing", "shortlisted", "rejected"],
  reviewing: ["shortlisted", "rejected"],
  shortlisted: ["hired", "rejected"],
  rejected: [],
  hired: [],
  withdrawn: [],
};

function statusClassName(status: JobApplicationStatus): string {
  if (status === "hired") return "bg-emerald-100 text-emerald-800";
  if (status === "shortlisted") return "bg-sky-100 text-sky-800";
  if (status === "rejected") return "bg-rose-100 text-rose-800";
  if (status === "withdrawn") return "bg-slate-200 text-slate-700";
  if (status === "reviewing") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export default function EmployerApplicantsPage() {
  const params = useParams<{ id: string }>();
  const jobListingId = Number(params.id);
  const [jobTitle, setJobTitle] = useState("Job listing");
  const [status, setStatus] = useState<JobApplicationStatus | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<JobApplicationPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchInput.trim();
      setSearch((current) => {
        if (current !== normalized) {
          setPage(1);
          setIsLoading(true);
        }
        return normalized;
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    getEmployerJob.execute(jobListingId).then((job) => {
      if (active) setJobTitle(job.title);
    }).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [jobListingId]);

  useEffect(() => {
    let active = true;
    listEmployerJobApplications
      .execute(jobListingId, {
        status,
        search: search || undefined,
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
        if (active) setError("Applicants could not be loaded or this listing does not belong to you.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [jobListingId, page, reloadToken, search, status]);

  const changeStatusFilter = (nextStatus?: JobApplicationStatus): void => {
    setStatus(nextStatus);
    setPage(1);
    setIsLoading(true);
  };

  const updateStatus = async (
    applicationId: number,
    nextStatus: EmployerManagedJobApplicationStatus,
  ): Promise<void> => {
    setUpdatingId(applicationId);
    setError(null);
    try {
      await updateJobApplicationStatus.execute(applicationId, nextStatus);
      setIsLoading(true);
      setReloadToken((token) => token + 1);
    } catch {
      setError("The application status could not be updated. Refresh and try again.");
    } finally {
      setUpdatingId(null);
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
      <div className="mx-auto max-w-7xl">
        <Link href="/employer/jobs" className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
          ← Back to job listings
        </Link>

        <header className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Applicant pipeline</p>
            <h1 className="mt-1 text-3xl font-bold">{jobTitle}</h1>
            <p className="mt-2 text-sm text-slate-500">Review cover letters and move candidates through controlled hiring stages.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <label htmlFor="applicant-search" className="sr-only">
                Search applicants by name, email, or cover letter
              </label>
              <input
                id="applicant-search"
                name="search"
                type="search"
                placeholder="Search name, email, or cover letter…"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:w-72"
              />
            </div>
            <select
              aria-label="Filter applications by status"
              value={status ?? ""}
              onChange={(event) => changeStatusFilter((event.target.value || undefined) as JobApplicationStatus | undefined)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <Link href="/employer/interviews" className="rounded-md bg-slate-950 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-slate-800">Manage interviews</Link>
          </div>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {([
            ["Total", counts.total],
            ["New", counts.submitted],
            ["Reviewing", counts.reviewing],
            ["Shortlisted", counts.shortlisted],
            ["Hired", counts.hired],
            ["Rejected", counts.rejected],
            ["Withdrawn", counts.withdrawn],
          ] as const).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {error ? <div role="alert" className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div aria-label="Loading applications" className="space-y-3 p-6">
              {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : null}

          {!isLoading && result?.items.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-xl font-bold">No applications found</h2>
              <p className="mt-2 text-sm text-slate-500">
                No candidates match the selected status or search term.
              </p>
            </div>
          ) : null}

          {!isLoading && result && result.items.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {result.items.map((application) => (
                <article key={application.id} className="grid gap-5 p-5 lg:grid-cols-[220px_minmax(0,1fr)_190px] lg:p-6">
                  <div>
                    <p className="font-bold text-slate-950">{application.applicant.name}</p>
                    <a href={`mailto:${application.applicant.email}`} className="mt-1 block break-all text-sm text-emerald-700 hover:underline">
                      {application.applicant.email}
                    </a>
                    <p className="mt-3 text-xs text-slate-500">
                      Applied {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(application.appliedAt))}
                    </p>
                    {application.resume.available ? (
                      <a
                        href={getResumeDownloadUrl.execute(application.id)}
                        className="mt-3 inline-flex text-xs font-bold text-emerald-700 hover:underline"
                      >
                        Download {application.resume.originalName ?? "resume.pdf"}
                      </a>
                    ) : (
                      <p className="mt-3 text-xs text-slate-400">No resume attached</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cover letter</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{application.coverLetter}</p>
                  </div>

                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClassName(application.status)}`}>
                      {statusLabels[application.status]}
                    </span>
                    {nextStatuses[application.status].length > 0 ? (
                      <label className="mt-4 block">
                        <span className="text-xs font-bold text-slate-500">Move to</span>
                        <select
                          aria-label={`Update ${application.applicant.name} application status`}
                          value=""
                          disabled={updatingId === application.id}
                          onChange={(event) => updateStatus(application.id, event.target.value as EmployerManagedJobApplicationStatus)}
                          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
                        >
                          <option value="" disabled>Select status</option>
                          {nextStatuses[application.status].map((nextStatus) => (
                            <option key={nextStatus} value={nextStatus}>{statusLabels[nextStatus]}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <p className="mt-4 text-xs text-slate-500">Final status</p>
                    )}
                  </div>

                  {application.status === "shortlisted" ? (
                    <div className="lg:col-span-3">
                      <InterviewScheduleForm applicationId={application.id} />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}

          {!isLoading && result && result.pagination.lastPage > 1 ? (
            <nav aria-label="Applicant pages" className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
              <button type="button" disabled={page <= 1} onClick={() => { setIsLoading(true); setPage((current) => Math.max(1, current - 1)); }} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button>
              <span className="text-sm text-slate-600">Page {result.pagination.currentPage} of {result.pagination.lastPage}</span>
              <button type="button" disabled={page >= result.pagination.lastPage} onClick={() => { setIsLoading(true); setPage((current) => current + 1); }} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button>
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}
