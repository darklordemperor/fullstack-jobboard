<?php

namespace App\Application\JobListings\UseCases;

use App\Domain\JobListings\Repositories\SavedJobListingRepository;

final readonly class ListSavedJobListingIds
{
    public function __construct(
        private SavedJobListingRepository $savedJobListings,
    ) {}

    /**
     * @return list<int>
     */
    public function execute(int $userId): array
    {
        return $this->savedJobListings->listIdsForJobseeker($userId);
    }
}
