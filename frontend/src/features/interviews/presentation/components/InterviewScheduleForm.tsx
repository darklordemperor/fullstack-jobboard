"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { InterviewRequestError } from "@/features/interviews/application/errors/InterviewRequestError";
import { rescheduleInterview, scheduleInterview } from "@/features/interviews/composition/interviewDependencies";
import type { Interview } from "@/features/interviews/domain/entities/Interview";

interface Props {
  applicationId?: number;
  interview?: Interview;
  onSaved?: (interview: Interview) => void;
  onCancel?: () => void;
}

function toLocalInput(value?: string): string {
  const date = value ? new Date(value) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (!value) date.setHours(10, 0, 0, 0);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function InterviewScheduleForm({ applicationId, interview, onSaved, onCancel }: Props) {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(interview?.scheduledAt));
  const [durationMinutes, setDurationMinutes] = useState(interview?.durationMinutes ?? 60);
  const [location, setLocation] = useState(interview?.location ?? "");
  const [notes, setNotes] = useState(interview?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const input = {
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes,
      timezone,
      location: location.trim(),
      notes: notes.trim() || null,
    };

    try {
      const saved = interview
        ? await rescheduleInterview.execute(interview.id, input)
        : await scheduleInterview.execute(applicationId ?? 0, input);
      setSuccess(interview ? "Interview rescheduled; candidate confirmation is required again." : "Interview scheduled and invitation queued.");
      onSaved?.(saved);
    } catch (caught) {
      setError(caught instanceof InterviewRequestError ? caught.message : "The interview could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-slate-950">{interview ? "Reschedule interview" : "Schedule interview"}</p>
          <p className="mt-1 text-xs text-slate-500">Times are entered in {timezone} and stored as UTC.</p>
        </div>
        {onCancel ? <button type="button" onClick={onCancel} className="text-xs font-bold text-slate-500 hover:text-slate-950">Close</button> : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_.7fr_1.5fr]">
        <label className="text-xs font-bold text-slate-600">
          Date and time
          <input required type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-emerald-500" />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Duration
          <select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-emerald-500">
            {[30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-600">
          Meeting link or location
          <input required maxLength={255} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="https://meet.example/... or Meeting room 2" className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-emerald-500" />
        </label>
      </div>

      <label className="mt-3 block text-xs font-bold text-slate-600">
        Candidate notes <span className="font-normal text-slate-400">(optional)</span>
        <textarea maxLength={2000} rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Preparation guidance or agenda" className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-emerald-500" />
      </label>

      {error ? <p role="alert" className="mt-3 text-sm font-semibold text-rose-700">{error}</p> : null}
      {success ? <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{success}</p> : null}

      <button disabled={isSaving} type="submit" className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
        {isSaving ? "Saving…" : interview ? "Save new schedule" : "Send interview invitation"}
      </button>
    </form>
  );
}
