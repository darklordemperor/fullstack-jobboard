import { ListEmployerJobApplications } from "@/features/applications/application/use-cases/ListEmployerJobApplications";
import { GetResumeDownloadUrl } from "@/features/applications/application/use-cases/GetResumeDownloadUrl";
import { ListJobseekerApplications } from "@/features/applications/application/use-cases/ListJobseekerApplications";
import { SubmitJobApplication } from "@/features/applications/application/use-cases/SubmitJobApplication";
import { UpdateJobApplicationStatus } from "@/features/applications/application/use-cases/UpdateJobApplicationStatus";
import { WithdrawJobApplication } from "@/features/applications/application/use-cases/WithdrawJobApplication";
import { LaravelJobApplicationRepository } from "@/features/applications/infrastructure/http/LaravelJobApplicationRepository";

const repository = new LaravelJobApplicationRepository();

export const submitJobApplication = new SubmitJobApplication(repository);
export const listEmployerJobApplications = new ListEmployerJobApplications(repository);
export const updateJobApplicationStatus = new UpdateJobApplicationStatus(repository);
export const listJobseekerApplications = new ListJobseekerApplications(repository);
export const withdrawJobApplication = new WithdrawJobApplication(repository);
export const getResumeDownloadUrl = new GetResumeDownloadUrl(repository);
