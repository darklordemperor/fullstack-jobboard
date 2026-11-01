<?php

namespace App\Application\JobListings\UseCases;

use App\Application\JobListings\DTOs\ListEmployerJobListingsData;
use App\Application\JobListings\DTOs\ListEmployerJobListingsResult;
use App\Domain\JobListings\Repositories\JobListingRepository;

final readonly class ListEmployerJobListings
{
    public function __construct(private JobListingRepository $jobListings) {}

    public function execute(ListEmployerJobListingsData $data): ListEmployerJobListingsResult
    {
        return new ListEmployerJobListingsResult(
            page: $this->jobListings->searchByEmployer(
                employerId: $data->employerId,
                status: $data->status,
                page: $data->page,
                perPage: $data->perPage,
                search: $data->search,
            ),
            counts: $this->jobListings->statusCountsByEmployer($data->employerId),
        );
    }
}
