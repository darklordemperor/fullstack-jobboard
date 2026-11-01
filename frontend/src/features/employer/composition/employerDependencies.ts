import { CloseEmployerJob } from "@/features/employer/application/use-cases/CloseEmployerJob";
import { CreateEmployerJob } from "@/features/employer/application/use-cases/CreateEmployerJob";
import { GetEmployerJob } from "@/features/employer/application/use-cases/GetEmployerJob";
import { ListEmployerJobs } from "@/features/employer/application/use-cases/ListEmployerJobs";
import { PublishEmployerJob } from "@/features/employer/application/use-cases/PublishEmployerJob";
import { UpdateEmployerJob } from "@/features/employer/application/use-cases/UpdateEmployerJob";
import { LaravelEmployerJobRepository } from "@/features/employer/infrastructure/http/LaravelEmployerJobRepository";

const repository = new LaravelEmployerJobRepository();

export const listEmployerJobs = new ListEmployerJobs(repository);
export const getEmployerJob = new GetEmployerJob(repository);
export const createEmployerJob = new CreateEmployerJob(repository);
export const updateEmployerJob = new UpdateEmployerJob(repository);
export const publishEmployerJob = new PublishEmployerJob(repository);
export const closeEmployerJob = new CloseEmployerJob(repository);
