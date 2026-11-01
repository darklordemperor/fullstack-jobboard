import { z } from "zod";

export const employerJobSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(150),
    description: z
      .string()
      .trim()
      .min(50, "Description must contain at least 50 characters.")
      .max(20000),
    location: z.string().trim().min(1, "Location is required.").max(100),
    employmentType: z.enum(["full_time", "part_time", "contract", "remote"]),
    category: z.string().trim().min(1, "Category is required.").max(100),
    salaryMinimum: z.number().int().min(0).max(10000000),
    salaryMaximum: z.number().int().min(0).max(10000000),
  })
  .refine((data) => data.salaryMaximum >= data.salaryMinimum, {
    message: "Maximum salary must be greater than or equal to minimum salary.",
    path: ["salaryMaximum"],
  });

export type EmployerJobFormValues = z.infer<typeof employerJobSchema>;
