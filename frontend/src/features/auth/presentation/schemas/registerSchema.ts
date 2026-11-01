import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(255),
    email: z.string().trim().email("Enter a valid email address."),
    role: z.enum(["employer", "jobseeker"]),
    password: z.string().min(8, "Password must contain at least 8 characters."),
    passwordConfirmation: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
