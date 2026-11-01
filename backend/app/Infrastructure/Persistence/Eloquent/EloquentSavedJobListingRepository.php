<?php

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\JobListings\Enums\JobListingStatus;
use App\Domain\JobListings\Repositories\SavedJobListingRepository;
use App\Models\SavedJobListing;

final class EloquentSavedJobListingRepository implements SavedJobListingRepository
{
    /**
     * @return list<int>
     */
    public function listIdsForJobseeker(int $userId): array
    {
        return SavedJobListing::query()
            ->join('job_listings', 'job_listings.id', '=', 'saved_job_listings.job_listing_id')
            ->where('saved_job_listings.user_id', $userId)
            ->where('job_listings.status', JobListingStatus::Published->value)
            ->orderByDesc('saved_job_listings.created_at')
            ->orderByDesc('saved_job_listings.job_listing_id')
            ->pluck('saved_job_listings.job_listing_id')
            ->map(fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
    }

    public function save(int $userId, int $jobListingId): void
    {
        SavedJobListing::query()->firstOrCreate([
            'user_id' => $userId,
            'job_listing_id' => $jobListingId,
        ]);
    }

    public function remove(int $userId, int $jobListingId): void
    {
        SavedJobListing::query()
            ->where('user_id', $userId)
            ->where('job_listing_id', $jobListingId)
            ->delete();
    }
}
