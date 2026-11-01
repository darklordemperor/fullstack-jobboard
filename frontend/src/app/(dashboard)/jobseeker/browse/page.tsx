"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { searchJobs } from "@/features/jobs/composition/jobDependencies";
import type {
  EmploymentType,
  JobListingSort,
  JobSearchResult,
} from "@/features/jobs/domain/entities/JobListing";
import { useSavedJobsStore } from "@/features/jobs/presentation/store/savedJobsStore";

const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  remote: "Remote",
};

const defaultEmploymentTypes = Object.keys(
  employmentTypeLabels,
) as EmploymentType[];

const accents = [
  "bg-emerald-600",
  "bg-cyan-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
];

function formatSalary(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(company: string): string {
  return company
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function postedLabel(publishedAt: string): string {
  const milliseconds = Date.now() - new Date(publishedAt).getTime();
  const days = Math.max(0, Math.floor(milliseconds / 86_400_000));

  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";

  return `Posted ${days} days ago`;
}

function LoadingCards() {
  return (
    <div aria-label="Loading job listings" className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex gap-4">
            <div className="size-14 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="h-4 w-1/3 rounded bg-slate-100" />
              <div className="h-10 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BrowseJobsPage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<
    EmploymentType[]
  >([]);
  const [salaryCap, setSalaryCap] = useState(200000);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<JobListingSort>("newest");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<JobSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const savedJobIds = useSavedJobsStore((state) => state.savedJobIds);
  const pendingJobIds = useSavedJobsStore((state) => state.pendingJobIds);
  const loadSavedJobs = useSavedJobsStore((state) => state.loadSavedJobs);
  const toggleSavedJob = useSavedJobsStore((state) => state.toggleSavedJob);

  useEffect(() => {
    void loadSavedJobs();
  }, [loadSavedJobs]);

  useEffect(() => {
    let isCurrentRequest = true;

    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await searchJobs.execute({
          keyword,
          location,
          employmentTypes: selectedEmploymentTypes,
          salaryCap,
          category,
          savedOnly: showSavedOnly || undefined,
          sort,
          page,
          perPage: 8,
        });

        if (isCurrentRequest) {
          setResult(response);
        }
      } catch {
        if (isCurrentRequest) {
          setError(
            "We could not load job listings. Check that the Laravel API is running and try again.",
          );
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    }, keyword.trim() ? 300 : 0);

    return () => {
      isCurrentRequest = false;
      window.clearTimeout(timeout);
    };
  }, [
    category,
    keyword,
    location,
    page,
    reloadToken,
    salaryCap,
    selectedEmploymentTypes,
    showSavedOnly,
    sort,
  ]);

  const employmentTypes =
    result?.facets.employmentTypes.length
      ? result.facets.employmentTypes
      : defaultEmploymentTypes;

  const resetPage = (): void => setPage(1);

  const toggleEmploymentType = (employmentType: EmploymentType): void => {
    resetPage();
    setSelectedEmploymentTypes((currentTypes) =>
      currentTypes.includes(employmentType)
        ? currentTypes.filter((currentType) => currentType !== employmentType)
        : [...currentTypes, employmentType],
    );
  };

  const visibleItems = (result?.items ?? []).filter(
    (job) => !showSavedOnly || savedJobIds.includes(job.id),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-4">
            <div>
              <span className="text-xl font-bold text-slate-950">
                {result?.pagination.total ?? "—"}
              </span>{" "}
              live roles
            </div>
            <div>
              <span className="text-xl font-bold text-emerald-600">Live</span>{" "}
              Laravel API data
            </div>
            <div>
              <span className="text-xl font-bold text-slate-950">
                {result?.facets.locations.length ?? "—"}
              </span>{" "}
              locations
            </div>
            <Link href="/jobseeker/applications" className="flex items-center text-emerald-700 hover:underline">
              View my applications →
            </Link>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h1 className="text-xl font-bold text-slate-950">Browse Jobs</h1>
              <p className="mt-1 text-sm text-slate-500">
                Search published roles from the JobBoard API.
              </p>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Search</span>
                <input
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    resetPage();
                  }}
                  placeholder="Job title, keyword, employer"
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  type="search"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Location</span>
                <select
                  value={location}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    resetPage();
                  }}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">All locations</option>
                  {result?.facets.locations.map((locationOption) => (
                    <option key={locationOption} value={locationOption}>
                      {locationOption}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset>
                <legend className="text-sm font-semibold text-slate-800">Job type</legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {employmentTypes.map((employmentType) => (
                    <label
                      key={employmentType}
                      className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        checked={selectedEmploymentTypes.includes(employmentType)}
                        onChange={() => toggleEmploymentType(employmentType)}
                        type="checkbox"
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {employmentTypeLabels[employmentType]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Maximum starting salary</span>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                  <span>฿15,000</span>
                  <span>{salaryCap >= 200000 ? "฿200,000+" : `฿${salaryCap.toLocaleString()}`}</span>
                </div>
                <input
                  value={salaryCap}
                  onChange={(event) => {
                    setSalaryCap(Number(event.target.value));
                    resetPage();
                  }}
                  min={15000}
                  max={200000}
                  step={5000}
                  type="range"
                  className="mt-3 w-full accent-emerald-600"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Category</span>
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    resetPage();
                  }}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">All categories</option>
                  {result?.facets.categories.map((categoryOption) => (
                    <option key={categoryOption} value={categoryOption}>
                      {categoryOption}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </aside>

          <section className="space-y-4" aria-live="polite">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  {showSavedOnly ? "Saved jobs view" : "Published roles"}
                </p>
                <h2 className="text-2xl font-bold text-slate-950">
                  {showSavedOnly
                    ? `${visibleItems.length} saved jobs`
                    : `${result?.pagination.total ?? 0} matching jobs`}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  aria-pressed={showSavedOnly}
                  onClick={() => {
                    setShowSavedOnly((current) => !current);
                    resetPage();
                  }}
                  className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                    showSavedOnly
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                  }`}
                >
                  <span>Saved only</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                    {savedJobIds.length}
                  </span>
                </button>
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as JobListingSort);
                    resetPage();
                  }}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:w-44"
                >
                  <option value="newest">Newest first</option>
                  <option value="salary_desc">Highest salary</option>
                </select>
              </div>
            </div>

            {showSavedOnly && (
              <div className="flex flex-col justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900 sm:flex-row sm:items-center">
                <p>
                  Showing only roles you have bookmarked. Search filters and sorting still apply to your saved jobs.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSavedOnly(false);
                    resetPage();
                  }}
                  className="shrink-0 font-bold text-emerald-800 underline hover:text-emerald-950"
                >
                  Show all published roles
                </button>
              </div>
            )}

            {isLoading && <LoadingCards />}

            {!isLoading && error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center">
                <h3 className="text-lg font-bold text-rose-950">Job listings are unavailable</h3>
                <p className="mt-2 text-sm text-rose-700">{error}</p>
                <button
                  type="button"
                  onClick={() => setReloadToken((token) => token + 1)}
                  className="mt-5 rounded-md bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800"
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading && !error && (
              <div className="space-y-4">
                {visibleItems.map((job) => {
                  const isBookmarked = savedJobIds.includes(job.id);
                  const isBookmarkPending = pendingJobIds.includes(job.id);

                  return (
                    <article
                      key={job.id}
                      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div
                          className={`${accents[job.id % accents.length]} flex size-14 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white`}
                        >
                          {getInitials(job.employerName)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-bold text-slate-950">{job.title}</h3>
                              <p className="mt-1 text-sm font-medium text-slate-600">
                                {job.employerName}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={isBookmarkPending}
                              aria-pressed={isBookmarked}
                              onClick={() => void toggleSavedJob(job.id)}
                              aria-label={isBookmarked ? "Remove bookmark" : "Save job"}
                              className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className={`size-5 ${isBookmarked ? "fill-emerald-600 stroke-emerald-600" : "fill-none stroke-current"}`}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                            </button>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {job.location}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {employmentTypeLabels[job.employmentType]}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {job.category}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-base font-bold text-slate-950">
                                {formatSalary(job.salary.minimum, job.salary.currency)} -{" "}
                                {formatSalary(job.salary.maximum, job.salary.currency)}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {postedLabel(job.publishedAt)}
                              </p>
                            </div>
                            <Link
                              href={`/jobseeker/browse/${job.id}`}
                              className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                            >
                              View role
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {visibleItems.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                    <h3 className="text-lg font-bold text-slate-950">
                      {showSavedOnly ? "No saved jobs on this page" : "No jobs match these filters"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {showSavedOnly
                        ? "Bookmark roles using the save icon or switch back to all published roles."
                        : "Try a broader keyword, location, or salary range."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!isLoading && !error && result && result.pagination.lastPage > 1 && (
              <nav
                aria-label="Job listing pages"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Page {result.pagination.currentPage} of {result.pagination.lastPage}
                </span>
                <button
                  type="button"
                  disabled={page >= result.pagination.lastPage}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
