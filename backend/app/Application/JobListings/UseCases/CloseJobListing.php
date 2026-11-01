<?php

namespace App\Application\JobListings\UseCases;

use App\Application\JobListings\Exceptions\JobListingAccessDenied;
use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Domain\JobListings\Entities\JobListing;
use App\Domain\JobListings\Repositories\JobListingRepository;
use DateTimeImmutable;

final readonly class CloseJobListing
{
    public function __construct(private JobListingRepository $jobListings) {}

    public function execute(int $id, int $employerId): JobListing
    {
        $jobListing = $this->ownedJobListing($id, $employerId);

        return $this->jobListings->save($jobListing->close(new DateTimeImmutable));
    }

    private function ownedJobListing(int $id, int $employerId): JobListing
    {
        $jobListing = $this->jobListings->findById($id) ?? throw new JobListingNotFound;

        if (! $jobListing->belongsTo($employerId)) {
            throw new JobListingAccessDenied;
        }

        return $jobListing;
    }
}
