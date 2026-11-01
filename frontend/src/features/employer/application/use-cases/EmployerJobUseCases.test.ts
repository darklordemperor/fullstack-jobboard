import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmployerJobInput } from "@/features/employer/application/dto/EmployerJobInput";
import type { EmployerJobRepository } from "@/features/employer/application/ports/EmployerJobRepository";
import { CloseEmployerJob } from "@/features/employer/application/use-cases/CloseEmployerJob";
import { CreateEmployerJob } from "@/features/employer/application/use-cases/CreateEmployerJob";
import { GetEmployerJob } from "@/features/employer/application/use-cases/GetEmployerJob";
import { ListEmployerJobs } from "@/features/employer/application/use-cases/ListEmployerJobs";
import { PublishEmployerJob } from "@/features/employer/application/use-cases/PublishEmployerJob";
import { UpdateEmployerJob } from "@/features/employer/application/use-cases/UpdateEmployerJob";
import type {
  EmployerJobListingDetails,
  EmployerJobListingPage,
} from "@/features/employer/domain/entities/EmployerJobListing";

const input: EmployerJobInput = {
  title: "Platform Engineer",
  description: "Build reliable platform services and improve developer workflows across the company.",
  location: "Bangkok",
  employmentType: "full_time",
  category: "IT",
  salaryMinimum: 90000,
  salaryMaximum: 150000,
};

const details: EmployerJobListingDetails = {
  id: 7,
  employerId: 3,
  employerName: "JobBoard Labs",
  title: input.title,
  description: input.description,
  location: input.location,
  employmentType: input.employmentType,
  category: input.category,
  salary: { minimum: input.salaryMinimum, maximum: input.salaryMaximum, currency: "THB" },
  status: "draft",
  publishedAt: null,
  createdAt: "2026-10-29T00:00:00.000000Z",
  updatedAt: "2026-10-29T00:00:00.000000Z",
};

const page: EmployerJobListingPage = {
  items: [
    {
      ...details,
      applicationsCount: 4,
      shortlistedCount: 2,
    },
  ],
  pagination: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
  counts: { total: 1, draft: 1, published: 0, closed: 0 },
};

const methods = {
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
  close: vi.fn(),
};
const repository: EmployerJobRepository = methods;

describe("employer job use cases", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    methods.list.mockResolvedValue(page);
    methods.getById.mockResolvedValue(details);
    methods.create.mockResolvedValue(details);
    methods.update.mockResolvedValue(details);
    methods.publish.mockResolvedValue({ ...details, status: "published" });
    methods.close.mockResolvedValue({ ...details, status: "closed" });
  });

  it("delegates owner list filters without coupling to HTTP", async () => {
    const filters = { status: "draft" as const, search: "Platform", page: 2, perPage: 10 };

    await expect(new ListEmployerJobs(repository).execute(filters)).resolves.toBe(page);
    expect(methods.list).toHaveBeenCalledWith(filters);
  });

  it("rejects an invalid detail identifier before calling the repository", async () => {
    await expect(new GetEmployerJob(repository).execute(0)).rejects.toThrow(
      "Invalid job listing identifier.",
    );
    expect(methods.getById).not.toHaveBeenCalled();
  });

  it("delegates create and update inputs", async () => {
    await new CreateEmployerJob(repository).execute(input);
    await new UpdateEmployerJob(repository).execute(7, input);

    expect(methods.create).toHaveBeenCalledWith(input);
    expect(methods.update).toHaveBeenCalledWith(7, input);
  });

  it("delegates publication lifecycle commands", async () => {
    await new PublishEmployerJob(repository).execute(7);
    await new CloseEmployerJob(repository).execute(7);

    expect(methods.publish).toHaveBeenCalledWith(7);
    expect(methods.close).toHaveBeenCalledWith(7);
  });
});
