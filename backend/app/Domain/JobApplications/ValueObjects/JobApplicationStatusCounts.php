<?php

namespace App\Domain\JobApplications\ValueObjects;

final readonly class JobApplicationStatusCounts
{
    public function __construct(
        public int $total,
        public int $submitted,
        public int $reviewing,
        public int $shortlisted,
        public int $rejected,
        public int $hired,
        public int $withdrawn,
    ) {}
}
