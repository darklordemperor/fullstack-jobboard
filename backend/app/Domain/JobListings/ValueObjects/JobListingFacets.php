<?php

namespace App\Domain\JobListings\ValueObjects;

use App\Domain\JobListings\Enums\EmploymentType;

final readonly class JobListingFacets
{
    /**
     * @param  list<string>  $locations
     * @param  list<EmploymentType>  $employmentTypes
     * @param  list<string>  $categories
     */
    public function __construct(
        public array $locations,
        public array $employmentTypes,
        public array $categories,
    ) {}
}
