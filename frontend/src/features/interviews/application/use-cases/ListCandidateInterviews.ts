import type { InterviewFilters } from "@/features/interviews/application/dto/InterviewInput";
import type { InterviewRepository } from "@/features/interviews/application/ports/InterviewRepository";

export class ListCandidateInterviews {
  constructor(private readonly repository: InterviewRepository) {}
  execute(filters: InterviewFilters) {
    return this.repository.listForCandidate(filters);
  }
}
