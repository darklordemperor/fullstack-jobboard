import { describe, expect, it } from "vitest";
import { employerJobSchema } from "@/features/employer/presentation/schemas/employerJobSchema";

const validInput = {
  title: "Senior Backend Engineer",
  description: "Build reliable services and mentor the engineering team across several projects.",
  location: "Remote",
  employmentType: "remote" as const,
  category: "IT",
  salaryMinimum: 90000,
  salaryMaximum: 150000,
};

describe("employerJobSchema", () => {
  it("accepts a valid listing", () => {
    expect(employerJobSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a reversed salary range", () => {
    const result = employerJobSchema.safeParse({
      ...validInput,
      salaryMinimum: 150000,
      salaryMaximum: 90000,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.salaryMaximum).toContain(
      "Maximum salary must be greater than or equal to minimum salary.",
    );
  });

  it("rejects a short description", () => {
    const result = employerJobSchema.safeParse({ ...validInput, description: "Too short" });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.description).toBeDefined();
  });
});
