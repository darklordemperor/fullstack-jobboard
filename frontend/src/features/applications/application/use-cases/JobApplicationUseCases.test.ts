import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobApplicationRepository } from "@/features/applications/application/ports/JobApplicationRepository";
import { GetResumeDownloadUrl } from "@/features/applications/application/use-cases/GetResumeDownloadUrl";
import { ListEmployerJobApplications } from "@/features/applications/application/use-cases/ListEmployerJobApplications";
import { ListJobseekerApplications } from "@/features/applications/application/use-cases/ListJobseekerApplications";
import { SubmitJobApplication } from "@/features/applications/application/use-cases/SubmitJobApplication";
import { UpdateJobApplicationStatus } from "@/features/applications/application/use-cases/UpdateJobApplicationStatus";
import { WithdrawJobApplication } from "@/features/applications/application/use-cases/WithdrawJobApplication";
import type {
  JobApplication,
  JobApplicationPage,
} from "@/features/applications/domain/entities/JobApplication";

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

const methods = {
  submit: vi.fn(),
  listForEmployerJob: vi.fn(),
  listForApplicant: vi.fn(),
  updateStatus: vi.fn(),
  withdraw: vi.fn(),
  resumeDownloadUrl: vi.fn(),
};
const repository: JobApplicationRepository = methods;

describe("job application use cases", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    methods.submit.mockResolvedValue(application);
    methods.listForEmployerJob.mockResolvedValue(page);
    methods.listForApplicant.mockResolvedValue(page);
    methods.updateStatus.mockResolvedValue({ ...application, status: "reviewing" });
    methods.withdraw.mockResolvedValue({
      ...application,
      status: "withdrawn",
      withdrawnAt: "2026-10-29T01:00:00.000000Z",
    });
    methods.resumeDownloadUrl.mockReturnValue("/api/v1/job-applications/3/resume");
  });

  it("submits through the repository port", async () => {
    const input = { coverLetter: application.coverLetter };
    await expect(new SubmitJobApplication(repository).execute(7, input)).resolves.toBe(application);
    expect(methods.submit).toHaveBeenCalledWith(7, input);
  });

  it("rejects invalid identifiers before repository calls", async () => {
    await expect(new SubmitJobApplication(repository).execute(0, { coverLetter: "valid" })).rejects.toThrow(
      "Invalid job listing identifier.",
    );
    expect(methods.submit).not.toHaveBeenCalled();
  });

  it("delegates employer filters and status updates", async () => {
    const filters = { status: "submitted" as const, page: 1, perPage: 10 };
    await new ListEmployerJobApplications(repository).execute(7, filters);
    await new UpdateJobApplicationStatus(repository).execute(3, "reviewing");

    expect(methods.listForEmployerJob).toHaveBeenCalledWith(7, filters);
    expect(methods.updateStatus).toHaveBeenCalledWith(3, "reviewing");
  });

  it("delegates applicant history and withdrawal", async () => {
    const filters = { status: "submitted" as const, page: 1, perPage: 10 };

    await expect(new ListJobseekerApplications(repository).execute(filters)).resolves.toBe(page);
    await expect(new WithdrawJobApplication(repository).execute(3)).resolves.toMatchObject({
      status: "withdrawn",
    });

    expect(methods.listForApplicant).toHaveBeenCalledWith(filters);
    expect(methods.withdraw).toHaveBeenCalledWith(3);
  });

  it("returns the authorized resume endpoint through the repository port", () => {
    expect(new GetResumeDownloadUrl(repository).execute(3)).toBe(
      "/api/v1/job-applications/3/resume",
    );
    expect(methods.resumeDownloadUrl).toHaveBeenCalledWith(3);
  });

  it("rejects invalid applicant application identifiers", async () => {
    await expect(new WithdrawJobApplication(repository).execute(0)).rejects.toThrow(
      "Invalid job application identifier.",
    );
    expect(() => new GetResumeDownloadUrl(repository).execute(0)).toThrow(
      "Invalid job application identifier.",
    );
    expect(methods.withdraw).not.toHaveBeenCalled();
    expect(methods.resumeDownloadUrl).not.toHaveBeenCalled();
  });
});
