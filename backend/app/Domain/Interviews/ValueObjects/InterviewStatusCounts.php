<?php

namespace App\Domain\Interviews\ValueObjects;

final readonly class InterviewStatusCounts
{
    public function __construct(
        public int $total,
        public int $scheduled,
        public int $confirmed,
        public int $cancelled,
        public int $completed,
    ) {}
}
