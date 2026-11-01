<?php

namespace App\Domain\JobListings\Repositories;

interface SavedJobListingRepository
{
    /**
     * @return list<int>
     */
    public function listIdsForJobseeker(int $userId): array;

    public function save(int $userId, int $jobListingId): void;

    public function remove(int $userId, int $jobListingId): void;
}
