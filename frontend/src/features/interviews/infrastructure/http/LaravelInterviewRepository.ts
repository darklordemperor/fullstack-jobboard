import axios from "axios";
import type {
  InterviewFilters,
  InterviewScheduleInput,
} from "@/features/interviews/application/dto/InterviewInput";
import { InterviewRequestError } from "@/features/interviews/application/errors/InterviewRequestError";
import type { InterviewRepository } from "@/features/interviews/application/ports/InterviewRepository";
import type { Interview, InterviewPage } from "@/features/interviews/domain/entities/Interview";
import { apiClient } from "@/infrastructure/http/apiClient";
import type { components, operations } from "@/infrastructure/http/generated/openapi";

type LaravelErrorResponse = components["schemas"]["ErrorEnvelope"];
type InterviewDto = components["schemas"]["Interview"];
type InterviewEnvelope = components["schemas"]["InterviewEnvelope"];
type InterviewPageEnvelope = components["schemas"]["InterviewCollectionEnvelope"];
type InterviewWriteRequest = components["schemas"]["InterviewWriteRequest"];
type InterviewQuery = NonNullable<operations["listEmployerInterviews"]["parameters"]["query"]>;

export class LaravelInterviewRepository implements InterviewRepository {
  schedule(applicationId: number, input: InterviewScheduleInput): Promise<Interview> {
    return this.mutate("post", `/api/v1/employer/applications/${applicationId}/interviews`, input);
  }

  listForEmployer(filters: InterviewFilters): Promise<InterviewPage> {
    return this.execute(async () => {
      const params: InterviewQuery = filters;
      const response = await apiClient.get<InterviewPageEnvelope>("/api/v1/employer/interviews", { params });
      return this.toPage(response.data.data);
    });
  }

  listForCandidate(filters: InterviewFilters): Promise<InterviewPage> {
    return this.execute(async () => {
      const params: InterviewQuery = filters;
      const response = await apiClient.get<InterviewPageEnvelope>("/api/v1/jobseeker/interviews", { params });
      return this.toPage(response.data.data);
    });
  }

  confirm(interviewId: number): Promise<Interview> {
    return this.mutate("patch", `/api/v1/jobseeker/interviews/${interviewId}/confirm`);
  }

  reschedule(interviewId: number, input: InterviewScheduleInput): Promise<Interview> {
    return this.mutate("patch", `/api/v1/employer/interviews/${interviewId}/reschedule`, input);
  }

  cancel(interviewId: number): Promise<Interview> {
    return this.mutate("patch", `/api/v1/employer/interviews/${interviewId}/cancel`);
  }

  complete(interviewId: number): Promise<Interview> {
    return this.mutate("patch", `/api/v1/employer/interviews/${interviewId}/complete`);
  }

  private async mutate(
    method: "post" | "patch",
    url: string,
    input?: InterviewScheduleInput,
  ): Promise<Interview> {
    return this.execute(async () => {
      await apiClient.get("/sanctum/csrf-cookie");
      const payload: InterviewWriteRequest | undefined = input;
      const response = await apiClient[method]<InterviewEnvelope>(url, payload);
      return this.toEntity(response.data.data);
    });
  }

  private toEntity(interview: InterviewDto): Interview {
    return {
      id: interview.id,
      jobApplicationId: interview.jobApplicationId,
      jobListing: { ...interview.jobListing },
      employer: { ...interview.employer },
      candidate: { ...interview.candidate },
      scheduledAt: interview.scheduledAt,
      endsAt: interview.endsAt,
      durationMinutes: interview.durationMinutes,
      timezone: interview.timezone,
      location: interview.location,
      notes: interview.notes,
      status: interview.status,
      confirmedAt: interview.confirmedAt,
      cancelledAt: interview.cancelledAt,
      completedAt: interview.completedAt,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    };
  }

  private toPage(data: InterviewPageEnvelope["data"]): InterviewPage {
    return {
      items: data.items.map((item) => this.toEntity(item)),
      pagination: { ...data.pagination },
      counts: { ...data.counts },
    };
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (axios.isAxiosError<LaravelErrorResponse>(error)) {
        throw new InterviewRequestError(
          error.response?.data.message ?? error.message ?? "Interview request failed.",
          error.response?.status,
          error.response?.data.errors ?? {},
        );
      }
      throw error;
    }
  }
}
