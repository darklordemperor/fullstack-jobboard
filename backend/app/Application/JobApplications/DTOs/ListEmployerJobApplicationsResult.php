<?php

namespace App\Application\JobApplications\DTOs;

use App\Domain\JobApplications\ValueObjects\JobApplicationPage;
use App\Domain\JobApplications\ValueObjects\JobApplicationStatusCounts;

final readonly class ListEmployerJobApplicationsResult
{
    public function __construct(
        public JobApplicationPage $page,
        public JobApplicationStatusCounts $counts,
    ) {}
}
