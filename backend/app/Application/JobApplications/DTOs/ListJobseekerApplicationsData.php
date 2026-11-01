<?php

namespace App\Application\JobApplications\DTOs;

use App\Domain\JobApplications\Enums\JobApplicationStatus;

final readonly class ListJobseekerApplicationsData
{
    public function __construct(
        public int $applicantId,
        public ?JobApplicationStatus $status,
        public int $page,
        public int $perPage,
        public ?int $jobListingId = null,
        public ?string $search = null,
    ) {}
}
