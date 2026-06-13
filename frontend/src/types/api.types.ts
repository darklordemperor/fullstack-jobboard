export type UserRole = "employer" | "jobseeker" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: ValidationErrors | null;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
}

export interface Application {
  id: number;
  jobId: number;
  userId: number;
  status: string;
  resumeUrl: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginCredentials {
  name: string;
  password_confirmation: string;
}

export type ValidationErrors = Record<string, string[]>;

export interface LaravelValidationError {
  message: string;
  errors: ValidationErrors;
}
