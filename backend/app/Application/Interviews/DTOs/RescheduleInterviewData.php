<?php

namespace App\Application\Interviews\DTOs;

use DateTimeImmutable;

final readonly class RescheduleInterviewData
{
    public function __construct(
        public int $interviewId,
        public int $employerId,
        public DateTimeImmutable $scheduledAt,
        public int $durationMinutes,
        public string $timezone,
        public string $location,
        public ?string $notes,
    ) {}
}
