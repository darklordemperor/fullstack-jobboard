import { describe, expect, it } from "vitest";
import type { JobRepository } from "@/features/jobs/application/ports/JobRepository";
import { SearchJobs } from "@/features/jobs/application/use-cases/SearchJobs";
import type { JobSearchResult } from "@/features/jobs/domain/entities/JobListing";

const result: JobSearchResult = {
  items: [],
  pagination: { currentPage: 1, perPage: 12, lastPage: 1, total: 0 },
  facets: {
    locations: ["Bangkok", "Remote"],
    employmentTypes: ["full_time", "remote"],
    categories: ["IT", "Marketing"],
  },
};

const calls: unknown[] = [];
const repository: JobRepository = {
  search: async (filters) => {
    calls.push(filters);
    return result;
  },
  getPublishedById: async () => Promise.reject(new Error("Not used in search tests")),
  listSavedJobIds: async () => [],
  saveJob: async () => [],
  removeSavedJob: async () => [],
};

describe("SearchJobs", () => {
  it("normalizes optional text filters and delegates to the repository", async () => {
    calls.length = 0;
    const searchJobs = new SearchJobs(repository);
    const response = await searchJobs.execute({
      keyword: "  backend  ",
      location: "",
      employmentTypes: ["remote"],
      salaryCap: 90000,
      category: "",
      savedOnly: true,
      sort: "newest",
      page: 1,
      perPage: 12,
    });

    expect(response).toBe(result);
    expect(calls).toEqual([
      {
        keyword: "backend",
        location: undefined,
        employmentTypes: ["remote"],
        salaryCap: 90000,
        category: undefined,
        savedOnly: true,
        sort: "newest",
        page: 1,
        perPage: 12,
      },
    ]);
  });

  it("propagates repository failures", async () => {
    const failing = new SearchJobs({
      search: async () => Promise.reject(new Error("API unavailable")),
      getPublishedById: async () => Promise.reject(new Error("Not used in search tests")),
      listSavedJobIds: async () => [],
      saveJob: async () => [],
      removeSavedJob: async () => [],
    });

    await expect(
      failing.execute({
        employmentTypes: [],
        sort: "newest",
        page: 1,
        perPage: 12,
      }),
    ).rejects.toThrow("API unavailable");
  });
});
