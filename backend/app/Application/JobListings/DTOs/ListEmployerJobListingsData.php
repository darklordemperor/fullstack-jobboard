<?php

namespace App\Application\JobListings\DTOs;

use App\Domain\JobListings\Enums\JobListingStatus;

final readonly class ListEmployerJobListingsData
{
    public function __construct(
        public int $employerId,
        public ?JobListingStatus $status,
        public int $page,
        public int $perPage,
        public ?string $search = null,
    ) {}
}
