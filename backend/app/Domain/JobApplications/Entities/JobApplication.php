<?php

namespace App\Domain\JobApplications\Entities;

use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Domain\JobApplications\ValueObjects\ResumeAttachment;
use DateTimeImmutable;
use DomainException;

final readonly class JobApplication
{
    public function __construct(
        public int $id,
        public int $jobListingId,
        public string $jobTitle,
        public int $employerId,
        public int $applicantId,
        public string $applicantName,
        public string $applicantEmail,
        public string $coverLetter,
        public ?ResumeAttachment $resume,
        public JobApplicationStatus $status,
        public DateTimeImmutable $statusChangedAt,
        public ?DateTimeImmutable $withdrawnAt,
        public DateTimeImmutable $createdAt,
        public DateTimeImmutable $updatedAt,
    ) {}

    public function belongsToEmployer(int $employerId): bool
    {
        return $this->employerId === $employerId;
    }

    public function belongsToApplicant(int $applicantId): bool
    {
        return $this->applicantId === $applicantId;
    }

    public function transitionTo(JobApplicationStatus $status, DateTimeImmutable $changedAt): self
    {
        if ($status === $this->status) {
            return $this;
        }

        $allowedTransitions = match ($this->status) {
            JobApplicationStatus::Submitted => [
                JobApplicationStatus::Reviewing,
                JobApplicationStatus::Shortlisted,
                JobApplicationStatus::Rejected,
            ],
            JobApplicationStatus::Reviewing => [
                JobApplicationStatus::Shortlisted,
                JobApplicationStatus::Rejected,
            ],
            JobApplicationStatus::Shortlisted => [
                JobApplicationStatus::Hired,
                JobApplicationStatus::Rejected,
            ],
            JobApplicationStatus::Rejected, JobApplicationStatus::Hired, JobApplicationStatus::Withdrawn => [],
        };

        if (! in_array($status, $allowedTransitions, true)) {
            throw new DomainException("Application cannot move from {$this->status->value} to {$status->value}.");
        }

        return new self(
            id: $this->id,
            jobListingId: $this->jobListingId,
            jobTitle: $this->jobTitle,
            employerId: $this->employerId,
            applicantId: $this->applicantId,
            applicantName: $this->applicantName,
            applicantEmail: $this->applicantEmail,
            coverLetter: $this->coverLetter,
            resume: $this->resume,
            status: $status,
            statusChangedAt: $changedAt,
            withdrawnAt: $this->withdrawnAt,
            createdAt: $this->createdAt,
            updatedAt: $changedAt,
        );
    }

    public function withdraw(DateTimeImmutable $withdrawnAt): self
    {
        if (! in_array($this->status, [
            JobApplicationStatus::Submitted,
            JobApplicationStatus::Reviewing,
            JobApplicationStatus::Shortlisted,
        ], true)) {
            throw new DomainException("Application cannot be withdrawn from {$this->status->value} status.");
        }

        return new self(
            id: $this->id,
            jobListingId: $this->jobListingId,
            jobTitle: $this->jobTitle,
            employerId: $this->employerId,
            applicantId: $this->applicantId,
            applicantName: $this->applicantName,
            applicantEmail: $this->applicantEmail,
            coverLetter: $this->coverLetter,
            resume: $this->resume,
            status: JobApplicationStatus::Withdrawn,
            statusChangedAt: $withdrawnAt,
            withdrawnAt: $withdrawnAt,
            createdAt: $this->createdAt,
            updatedAt: $withdrawnAt,
        );
    }
}
