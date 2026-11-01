<?php

namespace App\Domain\Interviews\Repositories;

use App\Domain\Interviews\Entities\Interview;
use App\Domain\Interviews\Enums\InterviewStatus;
use App\Domain\Interviews\ValueObjects\InterviewPage;
use DateTimeImmutable;

interface InterviewRepository
{
    public function create(
        int $jobApplicationId,
        int $employerId,
        int $candidateId,
        DateTimeImmutable $scheduledAt,
        int $durationMinutes,
        string $timezone,
        string $location,
        ?string $notes,
    ): Interview;

    public function findById(int $id): ?Interview;

    public function hasActiveConflict(
        int $employerId,
        int $candidateId,
        DateTimeImmutable $startsAt,
        DateTimeImmutable $endsAt,
        ?int $ignoreInterviewId = null,
    ): bool;

    public function searchByEmployer(
        int $employerId,
        ?InterviewStatus $status,
        int $page,
        int $perPage,
    ): InterviewPage;

    public function searchByCandidate(
        int $candidateId,
        ?InterviewStatus $status,
        int $page,
        int $perPage,
    ): InterviewPage;

    public function save(Interview $interview): Interview;
}
