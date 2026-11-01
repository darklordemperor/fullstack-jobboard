import { describe, expect, it } from "vitest";
import { registerSchema } from "@/features/auth/presentation/schemas/registerSchema";

const validRegistration = {
  name: "Jane Candidate",
  email: "jane@example.com",
  role: "jobseeker",
  password: "password",
  passwordConfirmation: "password",
};

describe("registerSchema", () => {
  it("accepts a valid jobseeker registration", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      passwordConfirmation: "different",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.passwordConfirmation).toContain(
      "Passwords do not match.",
    );
  });

  it("does not allow public admin registration", () => {
    const result = registerSchema.safeParse({ ...validRegistration, role: "admin" });

    expect(result.success).toBe(false);
  });
});
