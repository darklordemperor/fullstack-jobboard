import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InterviewRepository } from "@/features/interviews/application/ports/InterviewRepository";
import { CancelInterview } from "@/features/interviews/application/use-cases/CancelInterview";
import { CompleteInterview } from "@/features/interviews/application/use-cases/CompleteInterview";
import { ConfirmInterview } from "@/features/interviews/application/use-cases/ConfirmInterview";
import { ListCandidateInterviews } from "@/features/interviews/application/use-cases/ListCandidateInterviews";
import { ListEmployerInterviews } from "@/features/interviews/application/use-cases/ListEmployerInterviews";
import { RescheduleInterview } from "@/features/interviews/application/use-cases/RescheduleInterview";
import { ScheduleInterview } from "@/features/interviews/application/use-cases/ScheduleInterview";
import type { Interview, InterviewPage } from "@/features/interviews/domain/entities/Interview";

const interview: Interview = {
  id: 4,
  jobApplicationId: 9,
  jobListing: { id: 2, title: "Backend Engineer" },
  employer: { id: 1, name: "Acme" },
  candidate: { id: 3, name: "Jane", email: "jane@example.com" },
  scheduledAt: "2026-11-02T03:00:00.000000Z",
  endsAt: "2026-11-02T04:00:00.000000Z",
  durationMinutes: 60,
  timezone: "Asia/Bangkok",
  location: "https://meet.example/interview",
  notes: null,
  status: "scheduled",
  confirmedAt: null,
  cancelledAt: null,
  completedAt: null,
  createdAt: "2026-10-29T00:00:00.000000Z",
  updatedAt: "2026-10-29T00:00:00.000000Z",
};

const page: InterviewPage = {
  items: [interview],
  pagination: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
  counts: { total: 1, scheduled: 1, confirmed: 0, cancelled: 0, completed: 0 },
};

const methods = {
  schedule: vi.fn(),
  listForEmployer: vi.fn(),
  listForCandidate: vi.fn(),
  confirm: vi.fn(),
  reschedule: vi.fn(),
  cancel: vi.fn(),
  complete: vi.fn(),
};
const repository: InterviewRepository = methods;
const input = {
  scheduledAt: interview.scheduledAt,
  durationMinutes: 60,
  timezone: "Asia/Bangkok",
  location: interview.location,
};

describe("interview use cases", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    methods.schedule.mockResolvedValue(interview);
    methods.listForEmployer.mockResolvedValue(page);
    methods.listForCandidate.mockResolvedValue(page);
    methods.confirm.mockResolvedValue({ ...interview, status: "confirmed" });
    methods.reschedule.mockResolvedValue(interview);
    methods.cancel.mockResolvedValue({ ...interview, status: "cancelled" });
    methods.complete.mockResolvedValue({ ...interview, status: "completed" });
  });

  it("keeps scheduling behind the repository port", async () => {
    await expect(new ScheduleInterview(repository).execute(9, input)).resolves.toBe(interview);
    expect(methods.schedule).toHaveBeenCalledWith(9, input);
  });

  it("delegates role-specific list filters", async () => {
    const filters = { status: "scheduled" as const, page: 1, perPage: 10 };
    await new ListEmployerInterviews(repository).execute(filters);
    await new ListCandidateInterviews(repository).execute(filters);
    expect(methods.listForEmployer).toHaveBeenCalledWith(filters);
    expect(methods.listForCandidate).toHaveBeenCalledWith(filters);
  });

  it("delegates each lifecycle command", async () => {
    await new ConfirmInterview(repository).execute(4);
    await new RescheduleInterview(repository).execute(4, input);
    await new CancelInterview(repository).execute(4);
    await new CompleteInterview(repository).execute(4);
    expect(methods.confirm).toHaveBeenCalledWith(4);
    expect(methods.reschedule).toHaveBeenCalledWith(4, input);
    expect(methods.cancel).toHaveBeenCalledWith(4);
    expect(methods.complete).toHaveBeenCalledWith(4);
  });

  it("rejects invalid identifiers before any adapter call", () => {
    expect(() => new ScheduleInterview(repository).execute(0, input)).toThrow("Invalid job application identifier.");
    expect(() => new ConfirmInterview(repository).execute(0)).toThrow("Invalid interview identifier.");
    expect(methods.schedule).not.toHaveBeenCalled();
    expect(methods.confirm).not.toHaveBeenCalled();
  });
});
