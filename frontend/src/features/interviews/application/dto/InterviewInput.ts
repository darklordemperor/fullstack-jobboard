import type { InterviewStatus } from "@/features/interviews/domain/entities/Interview";

export interface InterviewScheduleInput {
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  location: string;
  notes?: string | null;
}

export interface InterviewFilters {
  status?: InterviewStatus;
  page?: number;
  perPage?: number;
}
