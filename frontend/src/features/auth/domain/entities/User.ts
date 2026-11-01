export type UserRole = "employer" | "jobseeker" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
