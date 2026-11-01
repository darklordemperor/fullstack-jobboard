import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  EmployerJobListingDetails,
  EmployerJobListingPage,
} from "@/features/employer/domain/entities/EmployerJobListing";
import { LaravelEmployerJobRepository } from "@/features/employer/infrastructure/http/LaravelEmployerJobRepository";

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@/infrastructure/http/apiClient", () => ({ apiClient: client }));

const details: EmployerJobListingDetails = {
  id: 4,
  employerId: 2,
  employerName: "JobBoard Labs",
  title: "Backend Engineer",
  description: "Build maintainable services and improve the reliability of our application platform.",
  location: "Remote",
  employmentType: "remote",
  category: "IT",
  salary: { minimum: 80000, maximum: 140000, currency: "THB" },
  status: "draft",
  publishedAt: null,
  createdAt: "2026-10-29T00:00:00.000000Z",
  updatedAt: "2026-10-29T00:00:00.000000Z",
};

const summary = {
  id: details.id,
  title: details.title,
  location: details.location,
  employmentType: details.employmentType,
  category: details.category,
  salary: details.salary,
  status: details.status,
  applicationsCount: 3,
  shortlistedCount: 1,
  publishedAt: details.publishedAt,
  updatedAt: details.updatedAt,
};

const page: EmployerJobListingPage = {
  items: [summary],
  pagination: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
  counts: { total: 1, draft: 1, published: 0, closed: 0 },
};

const envelope = <T>(data: T) => ({
  data: { success: true, data, message: "OK", errors: null },
});

describe("LaravelEmployerJobRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("sends employer list filters using the documented API contract", async () => {
    client.get.mockResolvedValueOnce(envelope(page));

    await expect(
      new LaravelEmployerJobRepository().list({
        status: "draft",
        search: "Backend",
        page: 1,
        perPage: 10,
      }),
    ).resolves.toEqual(page);
    expect(client.get).toHaveBeenCalledWith("/api/v1/employer/job-listings", {
      params: { status: "draft", search: "Backend", page: 1, perPage: 10 },
    });
  });

  it("loads the CSRF cookie before creating a listing", async () => {
    const input = {
      title: details.title,
      description: details.description,
      location: details.location,
      employmentType: details.employmentType,
      category: details.category,
      salaryMinimum: details.salary.minimum,
      salaryMaximum: details.salary.maximum,
    };
    client.get.mockResolvedValueOnce({});
    client.post.mockResolvedValueOnce(envelope(details));

    await expect(new LaravelEmployerJobRepository().create(input)).resolves.toEqual(details);
    expect(client.get).toHaveBeenCalledWith("/sanctum/csrf-cookie");
    expect(client.post).toHaveBeenCalledWith("/api/v1/employer/job-listings", input);
    expect(client.get.mock.invocationCallOrder[0]).toBeLessThan(client.post.mock.invocationCallOrder[0]);
  });

  it("maps publish and close commands to their lifecycle endpoints", async () => {
    client.get.mockResolvedValue({});
    client.post.mockResolvedValue(envelope(details));
    const repository = new LaravelEmployerJobRepository();

    await repository.publish(4);
    await repository.close(4);

    expect(client.post).toHaveBeenNthCalledWith(1, "/api/v1/employer/job-listings/4/publish");
    expect(client.post).toHaveBeenNthCalledWith(2, "/api/v1/employer/job-listings/4/close");
  });
});
