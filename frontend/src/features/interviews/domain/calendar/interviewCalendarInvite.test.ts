import { describe, expect, it } from "vitest";
import type { Interview } from "../entities/Interview";
import {
  buildInterviewCalendarInvite,
  getInterviewCalendarFileName,
} from "./interviewCalendarInvite";

const interview: Interview = {
  id: 14,
  jobApplicationId: 22,
  jobListing: { id: 5, title: "Senior Platform Engineer, Payments" },
  employer: { id: 2, name: "Ascend Money" },
  candidate: { id: 9, name: "Jane Candidate", email: "jane@example.com" },
  scheduledAt: "2026-11-05T03:00:00.000000Z",
  endsAt: "2026-11-05T04:00:00.000000Z",
  durationMinutes: 60,
  timezone: "Asia/Bangkok",
  location: "https://meet.example/platform-interview",
  notes: "Prepare to discuss distributed systems;\nbring architecture diagrams.",
  status: "confirmed",
  confirmedAt: "2026-11-01T02:00:00.000000Z",
  cancelledAt: null,
  completedAt: null,
  createdAt: "2026-10-31T01:00:00.000000Z",
  updatedAt: "2026-11-01T02:00:00.000000Z",
};

describe("interviewCalendarInvite", () => {
  it("builds an RFC 5545 iCalendar payload with escaped text and UTC timestamps", () => {
    const ics = buildInterviewCalendarInvite(interview);

    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("UID:jobboard-interview-14@jobboard.local\r\n");
    expect(ics).toContain("DTSTART:20261105T030000Z\r\n");
    expect(ics).toContain("DTEND:20261105T040000Z\r\n");
    expect(ics).toContain(
      "SUMMARY:Interview: Senior Platform Engineer\\, Payments (Ascend Money)\r\n",
    );
    expect(ics).toContain("LOCATION:https://meet.example/platform-interview\r\n");
    expect(ics).toContain("STATUS:CONFIRMED\r\n");
    expect(ics).toContain(
      "Notes: Prepare to discuss distributed systems\\;\\nbring architecture diagrams.",
    );
  });

  it("generates a normalized .ics file name", () => {
    expect(getInterviewCalendarFileName(interview)).toBe(
      "interview-14-senior-platform-engineer-payments.ics",
    );
  });
});
