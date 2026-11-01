<?php

namespace App\Application\JobApplications\UseCases;

use App\Application\JobApplications\DTOs\ListEmployerJobApplicationsData;
use App\Application\JobApplications\DTOs\ListEmployerJobApplicationsResult;
use App\Application\JobListings\Exceptions\JobListingAccessDenied;
use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Domain\JobApplications\Repositories\JobApplicationRepository;
use App\Domain\JobListings\Repositories\JobListingRepository;

final readonly class ListEmployerJobApplications
{
    public function __construct(
        private JobApplicationRepository $applications,
        private JobListingRepository $jobListings,
    ) {}

    public function execute(ListEmployerJobApplicationsData $data): ListEmployerJobApplicationsResult
    {
        $jobListing = $this->jobListings->findById($data->jobListingId) ?? throw new JobListingNotFound;

        if (! $jobListing->belongsTo($data->employerId)) {
            throw new JobListingAccessDenied;
        }

        $normalizedSearch = $data->search === null ? null : trim($data->search);

        return new ListEmployerJobApplicationsResult(
            page: $this->applications->searchByEmployerJob(
                employerId: $data->employerId,
                jobListingId: $data->jobListingId,
                status: $data->status,
                page: $data->page,
                perPage: $data->perPage,
                search: $normalizedSearch === '' ? null : $normalizedSearch,
            ),
            counts: $this->applications->statusCountsByEmployerJob(
                employerId: $data->employerId,
                jobListingId: $data->jobListingId,
            ),
        );
    }
}
