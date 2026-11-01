<?php

namespace App\Application\JobListings\UseCases;

use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Domain\JobListings\Repositories\JobListingRepository;
use App\Domain\JobListings\Repositories\SavedJobListingRepository;

final readonly class SaveJobListing
{
    public function __construct(
        private JobListingRepository $jobListings,
        private SavedJobListingRepository $savedJobListings,
    ) {}

    /**
     * @return list<int>
     */
    public function execute(int $userId, int $jobListingId): array
    {
        $this->jobListings->findPublishedById($jobListingId) ?? throw new JobListingNotFound;

        $this->savedJobListings->save($userId, $jobListingId);

        return $this->savedJobListings->listIdsForJobseeker($userId);
    }
}
