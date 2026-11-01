<?php

namespace App\Domain\JobApplications\ValueObjects;

use App\Domain\JobApplications\Entities\JobApplication;

final readonly class JobApplicationPage
{
    /**
     * @param  list<JobApplication>  $items
     */
    public function __construct(
        public array $items,
        public int $currentPage,
        public int $perPage,
        public int $lastPage,
        public int $total,
    ) {}
}
