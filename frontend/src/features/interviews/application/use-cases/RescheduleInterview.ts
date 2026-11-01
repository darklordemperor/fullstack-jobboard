import type { InterviewScheduleInput } from "@/features/interviews/application/dto/InterviewInput";
import type { InterviewRepository } from "@/features/interviews/application/ports/InterviewRepository";

export class RescheduleInterview {
  constructor(private readonly repository: InterviewRepository) {}
  execute(interviewId: number, input: InterviewScheduleInput) {
    if (interviewId < 1) throw new Error("Invalid interview identifier.");
    return this.repository.reschedule(interviewId, input);
  }
}
