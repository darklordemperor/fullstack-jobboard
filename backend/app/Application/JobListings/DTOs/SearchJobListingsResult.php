<?php

namespace App\Application\JobListings\DTOs;

use App\Domain\JobListings\ValueObjects\JobListingFacets;
use App\Domain\JobListings\ValueObjects\JobListingPage;

final readonly class SearchJobListingsResult
{
    public function __construct(
        public JobListingPage $page,
        public JobListingFacets $facets,
    ) {}
}
