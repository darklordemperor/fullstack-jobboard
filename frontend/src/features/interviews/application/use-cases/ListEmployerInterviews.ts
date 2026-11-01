import type { InterviewFilters } from "@/features/interviews/application/dto/InterviewInput";
import type { InterviewRepository } from "@/features/interviews/application/ports/InterviewRepository";

export class ListEmployerInterviews {
  constructor(private readonly repository: InterviewRepository) {}
  execute(filters: InterviewFilters) {
    return this.repository.listForEmployer(filters);
  }
}
