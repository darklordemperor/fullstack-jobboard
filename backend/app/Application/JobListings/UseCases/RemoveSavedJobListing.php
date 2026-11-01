<?php

namespace App\Application\JobListings\UseCases;

use App\Domain\JobListings\Repositories\SavedJobListingRepository;

final readonly class RemoveSavedJobListing
{
    public function __construct(
        private SavedJobListingRepository $savedJobListings,
    ) {}

    /**
     * @return list<int>
     */
    public function execute(int $userId, int $jobListingId): array
    {
        $this->savedJobListings->remove($userId, $jobListingId);

        return $this->savedJobListings->listIdsForJobseeker($userId);
    }
}
