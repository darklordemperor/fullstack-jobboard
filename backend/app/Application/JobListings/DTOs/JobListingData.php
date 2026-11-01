<?php

namespace App\Application\JobListings\DTOs;

use App\Domain\JobListings\Enums\EmploymentType;

final readonly class JobListingData
{
    public function __construct(
        public string $title,
        public string $description,
        public string $location,
        public EmploymentType $employmentType,
        public string $category,
        public int $salaryMinimum,
        public int $salaryMaximum,
    ) {}
}
