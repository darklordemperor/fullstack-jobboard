import { z } from "zod";

export const jobApplicationSchema = z.object({
  coverLetter: z
    .string()
    .trim()
    .min(50, "Cover letter must contain at least 50 characters.")
    .max(5000, "Cover letter cannot exceed 5,000 characters."),
});

export type JobApplicationFormValues = z.infer<typeof jobApplicationSchema>;
