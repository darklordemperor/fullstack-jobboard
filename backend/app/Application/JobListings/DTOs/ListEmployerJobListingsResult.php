<?php

namespace App\Application\JobListings\DTOs;

use App\Domain\JobListings\ValueObjects\JobListingPage;
use App\Domain\JobListings\ValueObjects\JobListingStatusCounts;

final readonly class ListEmployerJobListingsResult
{
    public function __construct(
        public JobListingPage $page,
        public JobListingStatusCounts $counts,
    ) {}
}
