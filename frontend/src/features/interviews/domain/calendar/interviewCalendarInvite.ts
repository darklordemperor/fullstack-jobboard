import type { Interview } from "../entities/Interview";

function formatUtcTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid interview timestamp.");
  }

  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function getInterviewCalendarFileName(interview: Interview): string {
  const slug = interview.jobListing.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `interview-${interview.id}-${slug || "schedule"}.ics`;
}

export function buildInterviewCalendarInvite(interview: Interview): string {
  const dtStamp = formatUtcTimestamp(interview.updatedAt || interview.createdAt);
  const dtStart = formatUtcTimestamp(interview.scheduledAt);
  const dtEnd = formatUtcTimestamp(interview.endsAt);
  const summary = `Interview: ${interview.jobListing.title} (${interview.employer.name})`;
  const descriptionParts = [
    `Role: ${interview.jobListing.title}`,
    `Employer: ${interview.employer.name}`,
    `Candidate: ${interview.candidate.name} <${interview.candidate.email}>`,
    `Timezone: ${interview.timezone} (${interview.durationMinutes} minutes)`,
  ];

  if (interview.notes) {
    descriptionParts.push(`Notes: ${interview.notes}`);
  }

  const eventStatus =
    interview.status === "confirmed"
      ? "CONFIRMED"
      : interview.status === "cancelled"
        ? "CANCELLED"
        : "TENTATIVE";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JobBoard//Interview Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:jobboard-interview-${interview.id}@jobboard.local`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(interview.location)}`,
    `DESCRIPTION:${escapeIcsText(descriptionParts.join("\n"))}`,
    `STATUS:${eventStatus}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
