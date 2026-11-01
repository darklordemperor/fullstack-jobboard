import { CancelInterview } from "@/features/interviews/application/use-cases/CancelInterview";
import { CompleteInterview } from "@/features/interviews/application/use-cases/CompleteInterview";
import { ConfirmInterview } from "@/features/interviews/application/use-cases/ConfirmInterview";
import { ListCandidateInterviews } from "@/features/interviews/application/use-cases/ListCandidateInterviews";
import { ListEmployerInterviews } from "@/features/interviews/application/use-cases/ListEmployerInterviews";
import { RescheduleInterview } from "@/features/interviews/application/use-cases/RescheduleInterview";
import { ScheduleInterview } from "@/features/interviews/application/use-cases/ScheduleInterview";
import { LaravelInterviewRepository } from "@/features/interviews/infrastructure/http/LaravelInterviewRepository";

const repository = new LaravelInterviewRepository();

export const scheduleInterview = new ScheduleInterview(repository);
export const listEmployerInterviews = new ListEmployerInterviews(repository);
export const listCandidateInterviews = new ListCandidateInterviews(repository);
export const confirmInterview = new ConfirmInterview(repository);
export const rescheduleInterview = new RescheduleInterview(repository);
export const cancelInterview = new CancelInterview(repository);
export const completeInterview = new CompleteInterview(repository);
