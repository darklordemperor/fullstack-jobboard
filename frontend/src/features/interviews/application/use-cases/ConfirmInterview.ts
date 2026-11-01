import type { InterviewRepository } from "@/features/interviews/application/ports/InterviewRepository";

export class ConfirmInterview {
  constructor(private readonly repository: InterviewRepository) {}
  execute(interviewId: number) {
    if (interviewId < 1) throw new Error("Invalid interview identifier.");
    return this.repository.confirm(interviewId);
  }
}
