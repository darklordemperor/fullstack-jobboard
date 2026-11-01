import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  JobApplication,
  JobApplicationPage,
} from "@/features/applications/domain/entities/JobApplication";
import { LaravelJobApplicationRepository } from "@/features/applications/infrastructure/http/LaravelJobApplicationRepository";

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/infrastructure/http/apiClient", () => ({ apiClient: client }));

const application: JobApplication = {
  id: 3,
  jobListing: { id: 7, title: "Backend Engineer" },
  applicant: { id: 8, name: "Jane Candidate", email: "jane@example.com" },
  coverLetter: "I have relevant experience building reliable backend services and working across product teams.",
  resume: { available: true, originalName: "jane-resume.pdf", size: 2048 },
  status: "submitted",
  statusChangedAt: "2026-10-29T00:00:00.000000Z",
  withdrawnAt: null,
  appliedAt: "2026-10-29T00:00:00.000000Z",
  updatedAt: "2026-10-29T00:00:00.000000Z",
};

const page: JobApplicationPage = {
  items: [application],
  pagination: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
  counts: {
    total: 1,
    submitted: 1,
    reviewing: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
    withdrawn: 0,
  },
};

const envelope = <T>(data: T) => ({ data: { success: true, data, message: "OK", errors: null } });

describe("LaravelJobApplicationRepository", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads the CSRF cookie and submits multipart application data", async () => {
    client.get.mockResolvedValueOnce({});
    client.post.mockResolvedValueOnce(envelope(application));
    const input = {
      coverLetter: application.coverLetter,
      resume: {
        fileName: "jane-resume.pdf",
        mimeType: "application/pdf",
        size: 4,
        bytes: new Uint8Array([37, 80, 68, 70]).buffer,
      },
    };

    await expect(new LaravelJobApplicationRepository().submit(7, input)).resolves.toEqual(application);
    expect(client.get).toHaveBeenCalledWith("/sanctum/csrf-cookie");
    expect(client.post).toHaveBeenCalledWith(
      "/api/v1/job-listings/7/applications",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    const payload = client.post.mock.calls[0][1] as FormData;
    expect(payload.get("coverLetter")).toBe(application.coverLetter);
    const resume = payload.get("resume");
    expect(resume).toBeInstanceOf(Blob);
    expect((resume as Blob).size).toBe(4);
    expect((resume as File).name).toBe("jane-resume.pdf");
  });

  it("maps employer filters to the review endpoint", async () => {
    client.get.mockResolvedValueOnce(envelope(page));
    const filters = {
      status: "submitted" as const,
      search: "Jane",
      page: 1,
      perPage: 10,
    };

    await expect(new LaravelJobApplicationRepository().listForEmployerJob(7, filters)).resolves.toEqual(page);
    expect(client.get).toHaveBeenCalledWith("/api/v1/employer/job-listings/7/applications", {
      params: filters,
    });
  });

  it("maps applicant filters to the candidate history endpoint", async () => {
    client.get.mockResolvedValueOnce(envelope(page));
    const filters = {
      status: "submitted" as const,
      search: "Backend",
      page: 1,
      perPage: 10,
    };

    await expect(new LaravelJobApplicationRepository().listForApplicant(filters)).resolves.toEqual(
      page,
    );
    expect(client.get).toHaveBeenCalledWith("/api/v1/jobseeker/applications", {
      params: filters,
    });
  });

  it("maps status changes to the lifecycle endpoint", async () => {
    client.get.mockResolvedValueOnce({});
    client.patch.mockResolvedValueOnce(envelope({ ...application, status: "reviewing" }));

    await new LaravelJobApplicationRepository().updateStatus(3, "reviewing");
    expect(client.patch).toHaveBeenCalledWith("/api/v1/employer/applications/3/status", {
      status: "reviewing",
    });
  });

  it("maps withdrawals and private resume downloads", async () => {
    client.get.mockResolvedValueOnce({});
    client.patch.mockResolvedValueOnce(envelope({ ...application, status: "withdrawn" }));
    const repository = new LaravelJobApplicationRepository();

    await repository.withdraw(3);

    expect(client.patch).toHaveBeenCalledWith("/api/v1/jobseeker/applications/3/withdraw");
    expect(repository.resumeDownloadUrl(3)).toBe("/api/v1/job-applications/3/resume");
  });
});
