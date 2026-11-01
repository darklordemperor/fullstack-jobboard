import type { JobRepository } from "@/features/jobs/application/ports/JobRepository";

export class ListSavedJobIds {
  constructor(private readonly jobs: JobRepository) {}

  execute(): Promise<number[]> {
    return this.jobs.listSavedJobIds();
  }
}
