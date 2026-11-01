<?php

namespace App\Domain\JobListings\ValueObjects;

use App\Domain\JobListings\Entities\JobListing;

final readonly class JobListingPage
{
    /**
     * @param  list<JobListing>  $items
     */
    public function __construct(
        public array $items,
        public int $currentPage,
        public int $perPage,
        public int $lastPage,
        public int $total,
    ) {}
}
