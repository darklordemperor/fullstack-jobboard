"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmActionDialog } from "@/components/ui/ConfirmActionDialog";
import { InterviewRequestError } from "@/features/interviews/application/errors/InterviewRequestError";
import {
  cancelInterview,
  completeInterview,
  listEmployerInterviews,
} from "@/features/interviews/composition/interviewDependencies";
import {
  buildInterviewCalendarInvite,
  getInterviewCalendarFileName,
} from "@/features/interviews/domain/calendar/interviewCalendarInvite";
import type { Interview, InterviewPage, InterviewStatus } from "@/features/interviews/domain/entities/Interview";
import { InterviewScheduleForm } from "@/features/interviews/presentation/components/InterviewScheduleForm";

const labels: Record<InterviewStatus, string> = {
  scheduled: "Awaiting confirmation",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

function badge(status: InterviewStatus): string {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-800";
  if (status === "scheduled") return "bg-amber-100 text-amber-800";
  if (status === "cancelled") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

function localTime(interview: Interview): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
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

export default function EmployerInterviewsPage() {
  const [status, setStatus] = useState<InterviewStatus | undefined>();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<InterviewPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [pendingAction, setPendingAction] = useState<{
    interview: Interview;
    action: "cancel" | "complete";
  } | null>(null);

  useEffect(() => {
    let active = true;
    listEmployerInterviews
      .execute({ status, page, perPage: 10 })
      .then((response) => {
        if (active) {
          setResult(response);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError("Interviews could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, reloadToken, status]);

  const runAction = async (interview: Interview, action: "cancel" | "complete"): Promise<void> => {
    setUpdatingId(interview.id);
    setError(null);
    try {
      if (action === "cancel") await cancelInterview.execute(interview.id);
      else await completeInterview.execute(interview.id);
      setIsLoading(true);
      setReloadToken((token) => token + 1);
    } catch (caught) {
      setError(
        caught instanceof InterviewRequestError
          ? caught.message
          : "The interview could not be updated.",
      );
    } finally {
      setUpdatingId(null);
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
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Hiring operations</p>
            <h1 className="mt-1 text-3xl font-bold">Interview schedule</h1>
            <p className="mt-2 text-sm text-slate-500">
              Coordinate candidate meetings, export calendar invites, and keep confirmations visible to the hiring team.
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
              href="/employer/jobs"
              className="rounded-md bg-slate-950 px-5 py-2.5 text-center text-sm font-bold text-white hover:bg-slate-800"
            >
              Job listings
            </Link>
          </div>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {([
            ["All interviews", counts.total, undefined],
            ["Pending confirm", counts.scheduled, "scheduled"],
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
            ? [1, 2, 3].map((item) => (
                <div key={item} className="h-52 animate-pulse rounded-xl bg-white shadow-sm" />
              ))
            : null}
          {!isLoading && result?.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <h2 className="text-xl font-bold">No interviews found</h2>
              <p className="mt-2 text-sm text-slate-500">
                Shortlist a candidate from a job&apos;s applicant pipeline, then schedule the first conversation.
              </p>
            </div>
          ) : null}

          {!isLoading && result
            ? result.items.map((interview) => (
                <article
                  key={interview.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold">{interview.candidate.name}</h2>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${badge(interview.status)}`}
                        >
                          {labels[interview.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {interview.jobListing.title}
                      </p>
                      <a
                        href={`mailto:${interview.candidate.email}`}
                        className="mt-1 block text-sm text-slate-500 hover:underline"
                      >
                        {interview.candidate.email}
                      </a>
                    </div>
                    <div className="rounded-lg bg-slate-950 px-5 py-4 text-white lg:min-w-72">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">
                        Scheduled
                      </p>
                      <p className="mt-1 font-bold">{localTime(interview)}</p>
                      <p className="mt-1 text-xs text-slate-300">
                        {interview.timezone} · {interview.durationMinutes} minutes
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Location
                      </p>
                      <p className="mt-1 break-all text-sm text-slate-700">{interview.location}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Candidate notes
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                        {interview.notes || "No preparation notes."}
                      </p>
                    </div>
                  </div>

                  {editingId === interview.id ? (
                    <div className="mt-5">
                      <InterviewScheduleForm
                        interview={interview}
                        onCancel={() => setEditingId(null)}
                        onSaved={() => {
                          setEditingId(null);
                          setIsLoading(true);
                          setReloadToken((token) => token + 1);
                        }}
                      />
                    </div>
                  ) : null}

                  {interview.status === "scheduled" || interview.status === "confirmed" ? (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => downloadCalendarInvite(interview)}
                        className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        Add to calendar (.ics)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(interview.id)}
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === interview.id}
                        onClick={() => setPendingAction({ interview, action: "cancel" })}
                        className="rounded-md border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      {interview.status === "confirmed" ? (
                        <button
                          type="button"
                          disabled={updatingId === interview.id}
                          onClick={() => setPendingAction({ interview, action: "complete" })}
                          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Mark completed
                        </button>
                      ) : null}
                    </div>
                  ) : null}
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

      <ConfirmActionDialog
        isOpen={pendingAction !== null}
        title={
          pendingAction?.action === "cancel"
            ? "Cancel scheduled interview?"
            : "Mark interview completed?"
        }
        description={
          pendingAction?.action === "cancel"
            ? `Cancel the interview with ${pendingAction.interview.candidate.name} and notify the candidate?`
            : `Mark the interview with ${pendingAction?.interview.candidate.name ?? "this candidate"} as completed?`
        }
        confirmLabel={
          pendingAction?.action === "cancel" ? "Cancel interview" : "Mark completed"
        }
        tone={pendingAction?.action === "cancel" ? "danger" : "primary"}
        onCancel={() => setPendingAction(null)}
        onConfirm={async () => {
          const target = pendingAction;
          setPendingAction(null);
          if (target) {
            await runAction(target.interview, target.action);
          }
        }}
      />
    </main>
  );
}
