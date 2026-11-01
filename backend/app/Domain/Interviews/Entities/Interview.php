<?php

namespace App\Domain\Interviews\Entities;

use App\Domain\Interviews\Enums\InterviewStatus;
use DateTimeImmutable;
use DomainException;

final readonly class Interview
{
    public function __construct(
        public int $id,
        public int $jobApplicationId,
        public int $jobListingId,
        public string $jobTitle,
        public int $employerId,
        public string $employerName,
        public int $candidateId,
        public string $candidateName,
        public string $candidateEmail,
        public DateTimeImmutable $scheduledAt,
        public int $durationMinutes,
        public string $timezone,
        public string $location,
        public ?string $notes,
        public InterviewStatus $status,
        public ?DateTimeImmutable $confirmedAt,
        public ?DateTimeImmutable $cancelledAt,
        public ?DateTimeImmutable $completedAt,
        public DateTimeImmutable $createdAt,
        public DateTimeImmutable $updatedAt,
    ) {}

    public function belongsToEmployer(int $employerId): bool
    {
        return $this->employerId === $employerId;
    }

    public function belongsToCandidate(int $candidateId): bool
    {
        return $this->candidateId === $candidateId;
    }

    public function endsAt(): DateTimeImmutable
    {
        return $this->scheduledAt->modify("+{$this->durationMinutes} minutes");
    }

    public function confirm(DateTimeImmutable $confirmedAt): self
    {
        if ($this->status !== InterviewStatus::Scheduled) {
            throw new DomainException('Only a scheduled interview can be confirmed.');
        }

        return $this->copy(
            status: InterviewStatus::Confirmed,
            confirmedAt: $confirmedAt,
            updatedAt: $confirmedAt,
        );
    }

    public function reschedule(
        DateTimeImmutable $scheduledAt,
        int $durationMinutes,
        string $timezone,
        string $location,
        ?string $notes,
        DateTimeImmutable $changedAt,
    ): self {
        if (! $this->status->isActive()) {
            throw new DomainException('Only an active interview can be rescheduled.');
        }

        return $this->copy(
            scheduledAt: $scheduledAt,
            durationMinutes: $durationMinutes,
            timezone: $timezone,
            location: $location,
            notes: $notes,
            status: InterviewStatus::Scheduled,
            confirmedAt: null,
            updatedAt: $changedAt,
        );
    }

    public function cancel(DateTimeImmutable $cancelledAt): self
    {
        if (! $this->status->isActive()) {
            throw new DomainException('Only an active interview can be cancelled.');
        }

        return $this->copy(
            status: InterviewStatus::Cancelled,
            cancelledAt: $cancelledAt,
            updatedAt: $cancelledAt,
        );
    }

    public function complete(DateTimeImmutable $completedAt): self
    {
        if ($this->status !== InterviewStatus::Confirmed) {
            throw new DomainException('Only a confirmed interview can be completed.');
        }

        if ($completedAt < $this->endsAt()) {
            throw new DomainException('An interview cannot be completed before its scheduled end time.');
        }

        return $this->copy(
            status: InterviewStatus::Completed,
            completedAt: $completedAt,
            updatedAt: $completedAt,
        );
    }

    private function copy(
        ?DateTimeImmutable $scheduledAt = null,
        ?int $durationMinutes = null,
        ?string $timezone = null,
        ?string $location = null,
        string|false|null $notes = false,
        ?InterviewStatus $status = null,
        DateTimeImmutable|false|null $confirmedAt = false,
        DateTimeImmutable|false|null $cancelledAt = false,
        DateTimeImmutable|false|null $completedAt = false,
        ?DateTimeImmutable $updatedAt = null,
    ): self {
        return new self(
            id: $this->id,
            jobApplicationId: $this->jobApplicationId,
            jobListingId: $this->jobListingId,
            jobTitle: $this->jobTitle,
            employerId: $this->employerId,
            employerName: $this->employerName,
            candidateId: $this->candidateId,
            candidateName: $this->candidateName,
            candidateEmail: $this->candidateEmail,
            scheduledAt: $scheduledAt ?? $this->scheduledAt,
            durationMinutes: $durationMinutes ?? $this->durationMinutes,
            timezone: $timezone ?? $this->timezone,
            location: $location ?? $this->location,
            notes: $notes === false ? $this->notes : $notes,
            status: $status ?? $this->status,
            confirmedAt: $confirmedAt === false ? $this->confirmedAt : $confirmedAt,
            cancelledAt: $cancelledAt === false ? $this->cancelledAt : $cancelledAt,
            completedAt: $completedAt === false ? $this->completedAt : $completedAt,
            createdAt: $this->createdAt,
            updatedAt: $updatedAt ?? $this->updatedAt,
        );
    }
}
