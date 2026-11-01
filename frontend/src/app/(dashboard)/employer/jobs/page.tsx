"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmActionDialog } from "@/components/ui/ConfirmActionDialog";
import {
  closeEmployerJob,
  listEmployerJobs,
  publishEmployerJob,
} from "@/features/employer/composition/employerDependencies";
import type {
  EmployerJobListingPage,
  EmployerJobListingSummary,
  EmployerJobStatus,
} from "@/features/employer/domain/entities/EmployerJobListing";

const statusLabels: Record<EmployerJobStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
};

function statusClassName(status: EmployerJobStatus): string {
  if (status === "published") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "draft") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function formatDate(value: string | null): string {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatSalary(minimum: number, maximum: number, currency: string): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return `${formatter.format(minimum)} – ${formatter.format(maximum)}`;
}

function LoadingRows() {
  return (
    <div aria-label="Loading job listings" className="space-y-3 p-5">
      {[1, 2, 3].map((row) => (
        <div key={row} className="h-16 animate-pulse rounded-md bg-slate-100" />
      ))}
    </div>
  );
}

export default function EmployerJobsPage() {
  const [status, setStatus] = useState<EmployerJobStatus | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<EmployerJobListingPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [actionJobId, setActionJobId] = useState<number | null>(null);
  const [pendingCloseJob, setPendingCloseJob] =
    useState<EmployerJobListingSummary | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    let isCurrentRequest = true;

    listEmployerJobs
      .execute({
        status,
        search: debouncedSearch || undefined,
        page,
        perPage: 10,
      })
      .then((response) => {
        if (isCurrentRequest) {
          setResult(response);
          setError(null);
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setError("We could not load your job listings. Please try again.");
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
  }, [debouncedSearch, page, reloadToken, status]);

  const changeStatus = (nextStatus?: EmployerJobStatus): void => {
    setIsLoading(true);
    setStatus(nextStatus);
    setPage(1);
  };

  const changeSearch = (value: string): void => {
    setIsLoading(true);
    setSearchInput(value);
    setPage(1);
  };

  const reload = (): void => {
    setIsLoading(true);
    setReloadToken((token) => token + 1);
  };

  const runAction = async (jobId: number, action: "publish" | "close"): Promise<void> => {
    setActionJobId(jobId);
    setError(null);

    try {
      if (action === "publish") {
        await publishEmployerJob.execute(jobId);
      } else {
        await closeEmployerJob.execute(jobId);
      }
      reload();
    } catch {
      setError(`The job listing could not be ${action === "publish" ? "published" : "closed"}.`);
    } finally {
      setActionJobId(null);
    }
  };

  const counts = result?.counts ?? { total: 0, draft: 0, published: 0, closed: 0 };

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-7 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Live Laravel data</p>
            <h1 className="mt-1 text-3xl font-bold">Manage job posts</h1>
            <p className="mt-2 text-sm text-slate-500">
              Create drafts, publish openings, and close completed searches.
            </p>
          </div>
          <Link
            href="/employer/jobs/new"
            className="rounded-md bg-slate-950 px-5 py-2.5 text-center text-sm font-bold text-white hover:bg-slate-800"
          >
            Create job listing
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {([
            ["All listings", counts.total, undefined],
            ["Published", counts.published, "published"],
            ["Drafts", counts.draft, "draft"],
            ["Closed", counts.closed, "closed"],
          ] as const).map(([label, value, filter]) => (
            <button
              key={label}
              type="button"
              onClick={() => changeStatus(filter)}
              className={`rounded-lg border bg-white p-5 text-left shadow-sm transition ${status === filter ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200 hover:border-emerald-200"}`}
            >
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-bold">{value}</p>
            </button>
          ))}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-6 flex flex-col justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center"
          >
            <span>{error}</span>
            <button type="button" onClick={reload} className="font-bold underline">
              Try again
            </button>
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center">
            <div>
              <h2 id="employer-job-listings-heading" className="text-lg font-bold">
                Job listings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {status ? statusLabels[status].toLowerCase() : "all"} listings
                {debouncedSearch ? ` matching "${debouncedSearch}"` : ""}.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <input
                  type="search"
                  aria-label="Search owned job listings"
                  placeholder="Search title, location, or category…"
                  value={searchInput}
                  onChange={(event) => changeSearch(event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:w-72"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => changeSearch("")}
                    className="mt-1 text-xs font-semibold text-emerald-700 hover:underline sm:ml-2 sm:mt-0"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <select
                aria-label="Filter job listings by status"
                value={status ?? ""}
                onChange={(event) =>
                  changeStatus((event.target.value || undefined) as EmployerJobStatus | undefined)
                }
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {isLoading ? <LoadingRows /> : null}

          {!isLoading && result?.items.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-bold">No job listings found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Create a listing or adjust your search and status filters.
              </p>
              <Link
                href="/employer/jobs/new"
                className="mt-5 inline-flex rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white"
              >
                Create your first listing
              </Link>
            </div>
          ) : null}

          {!isLoading && result && result.items.length > 0 ? (
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="employer-job-listings-heading"
              className="overflow-x-auto focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3">
                      Job
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Salary
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Candidates
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Published
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.items.map((job) => (
                    <tr key={job.id} className="group hover:bg-slate-50">
                      <th
                        scope="row"
                        className="sticky left-0 bg-white px-5 py-4 text-left font-normal group-hover:bg-slate-50"
                      >
                        <p className="font-bold text-slate-950">{job.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {job.location} · {job.category}
                        </p>
                      </th>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {formatSalary(
                          job.salary.minimum,
                          job.salary.maximum,
                          job.salary.currency,
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClassName(job.status)}`}
                        >
                          {statusLabels[job.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {job.applicationsCount}{" "}
                            {job.applicationsCount === 1 ? "applicant" : "applicants"}
                          </span>
                          {job.shortlistedCount > 0 ? (
                            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
                              {job.shortlistedCount} shortlisted
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(job.publishedAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {job.status !== "closed" ? (
                            <Link
                              href={`/employer/jobs/${job.id}/edit`}
                              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                            >
                              Edit
                            </Link>
                          ) : null}
                          <Link
                            href={`/employer/jobs/${job.id}/applicants`}
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                          >
                            Applicants ({job.applicationsCount})
                          </Link>
                          {job.status === "draft" ? (
                            <button
                              type="button"
                              disabled={actionJobId === job.id}
                              onClick={() => void runAction(job.id, "publish")}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                            >
                              Publish
                            </button>
                          ) : null}
                          {job.status !== "closed" ? (
                            <button
                              type="button"
                              disabled={actionJobId === job.id}
                              onClick={() => setPendingCloseJob(job)}
                              className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50"
                            >
                              Close
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!isLoading && result && result.pagination.lastPage > 1 ? (
            <nav
              aria-label="Employer job listing pages"
              className="flex items-center justify-between border-t border-slate-200 px-5 py-4"
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
        isOpen={pendingCloseJob !== null}
        title="Close job listing?"
        description={
          pendingCloseJob
            ? `Close "${pendingCloseJob.title}"? Once closed, it cannot be edited or republished.`
            : "Once closed, this job listing cannot be edited or republished."
        }
        confirmLabel="Close job listing"
        onCancel={() => setPendingCloseJob(null)}
        onConfirm={async () => {
          const targetJob = pendingCloseJob;
          setPendingCloseJob(null);
          if (targetJob) {
            await runAction(targetJob.id, "close");
          }
        }}
      />
    </main>
  );
}
