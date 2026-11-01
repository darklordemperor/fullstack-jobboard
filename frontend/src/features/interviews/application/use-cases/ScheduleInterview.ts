import type { InterviewScheduleInput } from "@/features/interviews/application/dto/InterviewInput";
import type { InterviewRepository } from "@/features/interviews/application/ports/InterviewRepository";

export class ScheduleInterview {
  constructor(private readonly repository: InterviewRepository) {}

  execute(applicationId: number, input: InterviewScheduleInput) {
    if (applicationId < 1) throw new Error("Invalid job application identifier.");
    return this.repository.schedule(applicationId, input);
  }
}
