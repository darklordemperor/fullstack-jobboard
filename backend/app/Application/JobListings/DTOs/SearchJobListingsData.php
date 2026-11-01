<?php

namespace App\Application\JobListings\DTOs;

use App\Domain\JobListings\Enums\EmploymentType;

final readonly class SearchJobListingsData
{
    /**
     * @param  list<EmploymentType>  $employmentTypes
     */
    public function __construct(
        public ?string $keyword,
        public ?string $location,
        public array $employmentTypes,
        public ?int $salaryCap,
        public ?string $category,
        public string $sort,
        public int $page,
        public int $perPage,
        public ?int $savedByUserId = null,
    ) {}
}
