<?php

namespace App\Application\Interviews\DTOs;

use DateTimeImmutable;

final readonly class ScheduleInterviewData
{
    public function __construct(
        public int $employerId,
        public int $jobApplicationId,
        public DateTimeImmutable $scheduledAt,
        public int $durationMinutes,
        public string $timezone,
        public string $location,
        public ?string $notes,
    ) {}
}
