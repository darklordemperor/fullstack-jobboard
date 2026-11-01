<?php

namespace App\Application\JobApplications\UseCases;

use App\Application\JobApplications\DTOs\ListJobseekerApplicationsData;
use App\Application\JobApplications\DTOs\ListJobseekerApplicationsResult;
use App\Domain\JobApplications\Repositories\JobApplicationRepository;

final readonly class ListJobseekerApplications
{
    public function __construct(private JobApplicationRepository $applications) {}

    public function execute(ListJobseekerApplicationsData $data): ListJobseekerApplicationsResult
    {
        return new ListJobseekerApplicationsResult(
            page: $this->applications->searchByApplicant(
                applicantId: $data->applicantId,
                status: $data->status,
                page: $data->page,
                perPage: $data->perPage,
                jobListingId: $data->jobListingId,
                search: $data->search,
            ),
            counts: $this->applications->statusCountsByApplicant($data->applicantId),
        );
    }
}
