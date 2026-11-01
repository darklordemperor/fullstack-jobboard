<?php

namespace App\Application\Interviews\DTOs;

use App\Domain\Interviews\Enums\InterviewStatus;

final readonly class ListInterviewsData
{
    public function __construct(
        public int $userId,
        public ?InterviewStatus $status,
        public int $page,
        public int $perPage,
    ) {}
}
