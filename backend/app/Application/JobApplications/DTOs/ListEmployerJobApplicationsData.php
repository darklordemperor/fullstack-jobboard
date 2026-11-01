<?php

namespace App\Application\JobApplications\DTOs;

use App\Domain\JobApplications\Enums\JobApplicationStatus;

final readonly class ListEmployerJobApplicationsData
{
    public function __construct(
        public int $employerId,
        public int $jobListingId,
        public ?JobApplicationStatus $status,
        public int $page,
        public int $perPage,
        public ?string $search = null,
    ) {}
}
