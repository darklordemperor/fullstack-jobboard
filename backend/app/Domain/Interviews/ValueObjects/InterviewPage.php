<?php

namespace App\Domain\Interviews\ValueObjects;

use App\Domain\Interviews\Entities\Interview;

final readonly class InterviewPage
{
    /** @param list<Interview> $items */
    public function __construct(
        public array $items,
        public int $currentPage,
        public int $perPage,
        public int $lastPage,
        public int $total,
        public InterviewStatusCounts $counts = new InterviewStatusCounts(0, 0, 0, 0, 0),
    ) {}
}
