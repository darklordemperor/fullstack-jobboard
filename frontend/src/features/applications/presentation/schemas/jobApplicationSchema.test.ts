import { describe, expect, it } from "vitest";
import { jobApplicationSchema } from "@/features/applications/presentation/schemas/jobApplicationSchema";

describe("jobApplicationSchema", () => {
  it("accepts a meaningful cover letter", () => {
    const result = jobApplicationSchema.safeParse({
      coverLetter: "I have five years of relevant experience building reliable services and collaborating with product teams.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short cover letter", () => {
    const result = jobApplicationSchema.safeParse({ coverLetter: "I am interested." });
    expect(result.success).toBe(false);
  });
});
