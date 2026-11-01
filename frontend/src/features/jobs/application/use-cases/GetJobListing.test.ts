import { describe, expect, it } from "vitest";
import type { JobRepository } from "@/features/jobs/application/ports/JobRepository";
import { GetJobListing } from "@/features/jobs/application/use-cases/GetJobListing";
import type { JobListingDetails } from "@/features/jobs/domain/entities/JobListing";

const details: JobListingDetails = {
  id: 4,
  title: "Platform Engineer",
  employerName: "JobBoard Labs",
  description: "Build and operate the platform.",
  location: "Remote",
  employmentType: "remote",
  category: "IT",
  salary: { minimum: 90000, maximum: 150000, currency: "THB" },
  status: "published",
  publishedAt: "2026-10-29T00:00:00.000000Z",
  createdAt: "2026-10-28T00:00:00.000000Z",
  updatedAt: "2026-10-29T00:00:00.000000Z",
};

const repository: JobRepository = {
  search: async () => Promise.reject(new Error("Not used in detail tests")),
  getPublishedById: async () => details,
  listSavedJobIds: async () => [],
  saveJob: async () => [],
  removeSavedJob: async () => [],
};

describe("GetJobListing", () => {
  it("loads a published listing through the repository port", async () => {
    await expect(new GetJobListing(repository).execute(4)).resolves.toBe(details);
  });

  it("rejects an invalid identifier before calling infrastructure", async () => {
    await expect(new GetJobListing(repository).execute(Number.NaN)).rejects.toThrow(
      "Invalid job listing identifier.",
    );
  });
});
