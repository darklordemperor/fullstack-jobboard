import type { InterviewRepository } from "@/features/interviews/application/ports/InterviewRepository";

export class CompleteInterview {
  constructor(private readonly repository: InterviewRepository) {}
  execute(interviewId: number) {
    if (interviewId < 1) throw new Error("Invalid interview identifier.");
    return this.repository.complete(interviewId);
  }
}
