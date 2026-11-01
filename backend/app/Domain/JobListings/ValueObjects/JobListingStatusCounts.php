<?php

namespace App\Domain\JobListings\ValueObjects;

final readonly class JobListingStatusCounts
{
    public function __construct(
        public int $total,
        public int $draft,
        public int $published,
        public int $closed,
    ) {}
}
