"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InterviewRequestError } from "@/features/interviews/application/errors/InterviewRequestError";
import {
  confirmInterview,
  listCandidateInterviews,
} from "@/features/interviews/composition/interviewDependencies";
import {
  buildInterviewCalendarInvite,
  getInterviewCalendarFileName,
} from "@/features/interviews/domain/calendar/interviewCalendarInvite";
import type { Interview, InterviewPage, InterviewStatus } from "@/features/interviews/domain/entities/Interview";

const labels: Record<InterviewStatus, string> = {
  scheduled: "Action required",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

function time(interview: Interview): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: interview.timezone,
  }).format(new Date(interview.scheduledAt));
}

function downloadCalendarInvite(interview: Interview): void {
  const icsContent = buildInterviewCalendarInvite(interview);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getInterviewCalendarFileName(interview);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function CandidateInterviewsPage() {
  const [status, setStatus] = useState<InterviewStatus | undefined>();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<InterviewPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    listCandidateInterviews
      .execute({ status, page, perPage: 10 })
      .then((response) => {
        if (active) {
          setResult(response);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError("Your interview schedule could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, reloadToken, status]);

  const confirm = async (id: number): Promise<void> => {
    setConfirmingId(id);
    setError(null);
    try {
      await confirmInterview.execute(id);
      setIsLoading(true);
      setReloadToken((token) => token + 1);
    } catch (caught) {
      setError(
        caught instanceof InterviewRequestError
          ? caught.message
          : "The interview could not be confirmed.",
      );
    } finally {
      setConfirmingId(null);
    }
  };

  const filter = (next?: InterviewStatus): void => {
    setStatus(next);
    setPage(1);
    setIsLoading(true);
  };

  const counts = result?.counts ?? {
    total: 0,
    scheduled: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  };

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Jobseeker portal</p>
            <h1 className="mt-1 text-3xl font-bold">My interviews</h1>
            <p className="mt-2 text-sm text-slate-500">
              Review invitations, confirm attendance, and export calendar invites in one place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              aria-label="Filter interviews by status"
              value={status ?? ""}
              onChange={(event) =>
                filter((event.target.value || undefined) as InterviewStatus | undefined)
              }
              className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
            >
              <option value="">All interviews</option>
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Link
              href="/jobseeker/applications"
              className="rounded-md bg-slate-950 px-5 py-2.5 text-center text-sm font-bold text-white hover:bg-slate-800"
            >
              My applications
            </Link>
          </div>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {([
            ["All interviews", counts.total, undefined],
            ["Needs response", counts.scheduled, "scheduled"],
            ["Confirmed", counts.confirmed, "confirmed"],
            ["Completed", counts.completed, "completed"],
            ["Cancelled", counts.cancelled, "cancelled"],
          ] as const).map(([label, value, statusFilter]) => (
            <button
              key={label}
              type="button"
              onClick={() => filter(statusFilter)}
              className={`rounded-xl border bg-white p-4 text-left shadow-sm transition ${
                status === statusFilter
                  ? "border-emerald-500 ring-2 ring-emerald-100"
                  : "border-slate-200 hover:border-emerald-200"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </button>
          ))}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
          >
            {error}
          </div>
        ) : null}

        <section aria-live="polite" className="mt-6 space-y-4">
          {isLoading
            ? [1, 2].map((item) => (
                <div key={item} className="h-64 animate-pulse rounded-xl bg-white shadow-sm" />
              ))
            : null}
          {!isLoading && result?.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <h2 className="text-xl font-bold">No interviews found</h2>
              <p className="mt-2 text-sm text-slate-500">
                Interview invitations appear here after an employer shortlists and schedules you.
              </p>
            </div>
          ) : null}

          {!isLoading && result
            ? result.items.map((interview) => (
                <article
                  key={interview.id}
                  className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
                    interview.status === "scheduled" ? "border-amber-300" : "border-slate-200"
                  }`}
                >
                  <div className="grid gap-6 p-6 md:grid-cols-[1fr_280px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold">{interview.jobListing.title}</h2>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            interview.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : interview.status === "scheduled"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {labels[interview.status]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">with {interview.employer.name}</p>
                      <div className="mt-6 rounded-lg bg-slate-950 p-5 text-white">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">
                          Local schedule
                        </p>
                        <p className="mt-2 text-lg font-bold">{time(interview)}</p>
                        <p className="mt-1 text-xs text-slate-300">
                          {interview.timezone} · {interview.durationMinutes} minutes
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Location
                        </p>
                        {/^https?:\/\//i.test(interview.location) ? (
                          <a
                            href={interview.location}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block break-all text-sm font-bold text-emerald-700 hover:underline"
                          >
                            Open meeting link
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-slate-700">{interview.location}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Preparation notes
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
                          {interview.notes || "No additional preparation notes."}
                        </p>
                      </div>
                      {interview.status === "scheduled" ? (
                        <button
                          type="button"
                          disabled={confirmingId === interview.id}
                          onClick={() => confirm(interview.id)}
                          className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {confirmingId === interview.id ? "Confirming…" : "Confirm attendance"}
                        </button>
                      ) : null}
                      {interview.status === "scheduled" || interview.status === "confirmed" ? (
                        <button
                          type="button"
                          onClick={() => downloadCalendarInvite(interview)}
                          className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          Add to calendar (.ics)
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            : null}

          {!isLoading && result && result.pagination.lastPage > 1 ? (
            <nav
              aria-label="Interview pages"
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
    </main>
  );
}
