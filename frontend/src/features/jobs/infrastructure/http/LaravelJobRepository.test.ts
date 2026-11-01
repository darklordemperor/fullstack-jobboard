import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobSearchResult } from "@/features/jobs/domain/entities/JobListing";
import { LaravelJobRepository } from "@/features/jobs/infrastructure/http/LaravelJobRepository";

const { get, post, del } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

vi.mock("@/infrastructure/http/apiClient", () => ({
  apiClient: { get, post, delete: del },
}));

const result: JobSearchResult = {
  items: [],
  pagination: { currentPage: 1, perPage: 8, lastPage: 1, total: 0 },
  facets: {
    locations: [],
    employmentTypes: ["full_time", "part_time", "contract", "remote"],
    categories: [],
  },
};

describe("LaravelJobRepository", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    del.mockReset();
  });

  it("maps search filters to the Laravel API contract", async () => {
    get.mockResolvedValue({
      data: { success: true, data: result, message: "OK", errors: null },
    });
    const repository = new LaravelJobRepository();

    const response = await repository.search({
      keyword: "backend",
      location: "Remote",
      employmentTypes: ["remote"],
      salaryCap: 100000,
      category: "IT",
      savedOnly: true,
      sort: "salary_desc",
      page: 2,
      perPage: 8,
    });

    expect(response).toEqual(result);
    expect(response).not.toBe(result);
    expect(get).toHaveBeenCalledWith("/api/v1/job-listings", {
      params: {
        keyword: "backend",
        location: "Remote",
        employmentTypes: ["remote"],
        salaryCap: 100000,
        category: "IT",
        savedOnly: true,
        sort: "salary_desc",
        page: 2,
        perPage: 8,
      },
    });
  });

  it("loads a published listing detail", async () => {
    const details = {
      id: 9,
      title: "Platform Engineer",
      employerName: "JobBoard Labs",
      description: "Build and operate the platform.",
      location: "Remote",
      employmentType: "remote" as const,
      category: "IT",
      salary: { minimum: 90000, maximum: 150000, currency: "THB" },
      status: "published" as const,
      publishedAt: "2026-10-29T00:00:00.000000Z",
      createdAt: "2026-10-28T00:00:00.000000Z",
      updatedAt: "2026-10-29T00:00:00.000000Z",
    };
    get.mockResolvedValue({
      data: { success: true, data: details, message: "OK", errors: null },
    });

    const response = await new LaravelJobRepository().getPublishedById(9);

    expect(response).toEqual(details);
    expect(response).not.toBe(details);
    expect(get).toHaveBeenCalledWith("/api/v1/job-listings/9");
  });

  it("lists, saves, and removes saved job listing IDs for a jobseeker", async () => {
    const repository = new LaravelJobRepository();

    get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { jobListingIds: [7, 4] },
        message: "OK",
        errors: null,
      },
    });
    await expect(repository.listSavedJobIds()).resolves.toEqual([7, 4]);
    expect(get).toHaveBeenCalledWith("/api/v1/jobseeker/saved-jobs");

    get.mockResolvedValueOnce({ data: undefined });
    post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { jobListingIds: [11, 7, 4] },
        message: "OK",
        errors: null,
      },
    });
    await expect(repository.saveJob(11)).resolves.toEqual([11, 7, 4]);
    expect(get).toHaveBeenCalledWith("/sanctum/csrf-cookie");
    expect(post).toHaveBeenCalledWith("/api/v1/jobseeker/saved-jobs/11");

    get.mockResolvedValueOnce({ data: undefined });
    del.mockResolvedValueOnce({
      data: {
        success: true,
        data: { jobListingIds: [7, 4] },
        message: "OK",
        errors: null,
      },
    });
    await expect(repository.removeSavedJob(11)).resolves.toEqual([7, 4]);
    expect(del).toHaveBeenCalledWith("/api/v1/jobseeker/saved-jobs/11");
  });
});
