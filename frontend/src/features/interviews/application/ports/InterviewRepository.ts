import type {
  InterviewFilters,
  InterviewScheduleInput,
} from "@/features/interviews/application/dto/InterviewInput";
import type { Interview, InterviewPage } from "@/features/interviews/domain/entities/Interview";

export interface InterviewRepository {
  schedule(applicationId: number, input: InterviewScheduleInput): Promise<Interview>;
  listForEmployer(filters: InterviewFilters): Promise<InterviewPage>;
  listForCandidate(filters: InterviewFilters): Promise<InterviewPage>;
  confirm(interviewId: number): Promise<Interview>;
  reschedule(interviewId: number, input: InterviewScheduleInput): Promise<Interview>;
  cancel(interviewId: number): Promise<Interview>;
  complete(interviewId: number): Promise<Interview>;
}
