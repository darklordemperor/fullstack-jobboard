import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Interview, InterviewPage } from "@/features/interviews/domain/entities/Interview";
import { LaravelInterviewRepository } from "@/features/interviews/infrastructure/http/LaravelInterviewRepository";

const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock("@/infrastructure/http/apiClient", () => ({ apiClient: client }));

const interview: Interview = {
  id: 4,
  jobApplicationId: 9,
  jobListing: { id: 7, title: "Backend Engineer" },
  employer: { id: 2, name: "JobBoard Labs" },
  candidate: { id: 8, name: "Jane Candidate", email: "jane@example.com" },
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
  createdAt: "2026-10-30T00:00:00.000000Z",
  updatedAt: "2026-10-30T00:00:00.000000Z",
};
const page: InterviewPage = {
  items: [interview],
  pagination: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
  counts: { total: 1, scheduled: 1, confirmed: 0, cancelled: 0, completed: 0 },
};
const envelope = <T>(data: T) => ({ data: { success: true, data, message: "OK", errors: null } });
const input = {
  scheduledAt: "2026-11-02T03:00:00.000Z",
  durationMinutes: 60,
  timezone: "Asia/Bangkok",
  location: "https://meet.example/interview",
};

describe("LaravelInterviewRepository", () => {
  beforeEach(() => vi.resetAllMocks());

  it("maps role-specific list endpoints", async () => {
    client.get.mockResolvedValueOnce(envelope(page)).mockResolvedValueOnce(envelope(page));
    const repository = new LaravelInterviewRepository();
    const filters = { status: "scheduled" as const, page: 1 };
    await expect(repository.listForEmployer(filters)).resolves.toEqual(page);
    await expect(repository.listForCandidate(filters)).resolves.toEqual(page);
    expect(client.get).toHaveBeenNthCalledWith(1, "/api/v1/employer/interviews", { params: filters });
    expect(client.get).toHaveBeenNthCalledWith(2, "/api/v1/jobseeker/interviews", { params: filters });
  });

  it("loads CSRF protection before scheduling and rescheduling", async () => {
    client.get.mockResolvedValue({});
    client.post.mockResolvedValueOnce(envelope(interview));
    client.patch.mockResolvedValueOnce(envelope(interview));
    const repository = new LaravelInterviewRepository();
    const scheduled = await repository.schedule(9, input);
    await repository.reschedule(4, input);
    expect(scheduled).toEqual(interview);
    expect(scheduled).not.toBe(interview);
    expect(client.post).toHaveBeenCalledWith("/api/v1/employer/applications/9/interviews", input);
    expect(client.patch).toHaveBeenCalledWith("/api/v1/employer/interviews/4/reschedule", input);
  });

  it("maps confirm cancel and complete commands", async () => {
    client.get.mockResolvedValue({});
    client.patch.mockResolvedValue(envelope(interview));
    const repository = new LaravelInterviewRepository();
    await repository.confirm(4);
    await repository.cancel(4);
    await repository.complete(4);
    expect(client.patch).toHaveBeenNthCalledWith(1, "/api/v1/jobseeker/interviews/4/confirm", undefined);
    expect(client.patch).toHaveBeenNthCalledWith(2, "/api/v1/employer/interviews/4/cancel", undefined);
    expect(client.patch).toHaveBeenNthCalledWith(3, "/api/v1/employer/interviews/4/complete", undefined);
  });
});
