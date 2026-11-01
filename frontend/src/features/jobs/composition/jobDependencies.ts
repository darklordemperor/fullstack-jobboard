import { GetJobListing } from "@/features/jobs/application/use-cases/GetJobListing";
import { ListSavedJobIds } from "@/features/jobs/application/use-cases/ListSavedJobIds";
import { SearchJobs } from "@/features/jobs/application/use-cases/SearchJobs";
import { ToggleSavedJob } from "@/features/jobs/application/use-cases/ToggleSavedJob";
import { LaravelJobRepository } from "@/features/jobs/infrastructure/http/LaravelJobRepository";

const jobRepository = new LaravelJobRepository();

export const searchJobs = new SearchJobs(jobRepository);
export const getJobListing = new GetJobListing(jobRepository);
export const listSavedJobIds = new ListSavedJobIds(jobRepository);
export const toggleSavedJob = new ToggleSavedJob(jobRepository);
