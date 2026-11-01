<?php

namespace App\Application\JobListings\UseCases;

use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Domain\JobListings\Entities\JobListing;
use App\Domain\JobListings\Repositories\JobListingRepository;

final readonly class GetPublishedJobListing
{
    public function __construct(private JobListingRepository $jobListings) {}

    public function execute(int $id): JobListing
    {
        return $this->jobListings->findPublishedById($id) ?? throw new JobListingNotFound;
    }
}
