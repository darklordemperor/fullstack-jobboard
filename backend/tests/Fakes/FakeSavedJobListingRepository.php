<?php

namespace Tests\Fakes;

use App\Domain\JobListings\Repositories\SavedJobListingRepository;

final class FakeSavedJobListingRepository implements SavedJobListingRepository
{
    /** @var array<int, list<int>> */
    public array $savedByUser = [];

    public function listIdsForJobseeker(int $jobseekerId): array
    {
        return $this->savedByUser[$jobseekerId] ?? [];
    }

    public function save(int $jobseekerId, int $jobListingId): void
    {
        $existing = $this->savedByUser[$jobseekerId] ?? [];
        if (! in_array($jobListingId, $existing, true)) {
            array_unshift($existing, $jobListingId);
        }

        $this->savedByUser[$jobseekerId] = array_values($existing);
    }

    public function remove(int $jobseekerId, int $jobListingId): void
    {
        $existing = $this->savedByUser[$jobseekerId] ?? [];
        $this->savedByUser[$jobseekerId] = array_values(array_filter(
            $existing,
            fn (int $id): bool => $id !== $jobListingId,
        ));
    }
}
