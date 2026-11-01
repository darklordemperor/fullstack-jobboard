<?php

namespace App\Domain\JobListings\Entities;

use App\Domain\JobListings\Enums\EmploymentType;
use App\Domain\JobListings\Enums\JobListingStatus;
use App\Domain\JobListings\ValueObjects\SalaryRange;
use DateTimeImmutable;
use DomainException;

final readonly class JobListing
{
    public function __construct(
        public int $id,
        public int $employerId,
        public string $employerName,
        public string $title,
        public string $description,
        public string $location,
        public EmploymentType $employmentType,
        public string $category,
        public SalaryRange $salary,
        public string $currency,
        public JobListingStatus $status,
        public ?DateTimeImmutable $publishedAt,
        public DateTimeImmutable $createdAt,
        public DateTimeImmutable $updatedAt,
        public int $applicationsCount = 0,
        public int $shortlistedCount = 0,
    ) {}

    public function belongsTo(int $employerId): bool
    {
        return $this->employerId === $employerId;
    }

    public function updateDetails(
        string $title,
        string $description,
        string $location,
        EmploymentType $employmentType,
        string $category,
        SalaryRange $salary,
        DateTimeImmutable $updatedAt,
    ): self {
        if ($this->status === JobListingStatus::Closed) {
            throw new DomainException('Closed job listings cannot be edited.');
        }

        return new self(
            id: $this->id,
            employerId: $this->employerId,
            employerName: $this->employerName,
            title: $title,
            description: $description,
            location: $location,
            employmentType: $employmentType,
            category: $category,
            salary: $salary,
            currency: $this->currency,
            status: $this->status,
            publishedAt: $this->publishedAt,
            createdAt: $this->createdAt,
            updatedAt: $updatedAt,
            applicationsCount: $this->applicationsCount,
            shortlistedCount: $this->shortlistedCount,
        );
    }

    public function publish(DateTimeImmutable $publishedAt): self
    {
        if ($this->status === JobListingStatus::Closed) {
            throw new DomainException('Closed job listings cannot be published.');
        }

        return new self(
            id: $this->id,
            employerId: $this->employerId,
            employerName: $this->employerName,
            title: $this->title,
            description: $this->description,
            location: $this->location,
            employmentType: $this->employmentType,
            category: $this->category,
            salary: $this->salary,
            currency: $this->currency,
            status: JobListingStatus::Published,
            publishedAt: $this->publishedAt ?? $publishedAt,
            createdAt: $this->createdAt,
            updatedAt: $publishedAt,
            applicationsCount: $this->applicationsCount,
            shortlistedCount: $this->shortlistedCount,
        );
    }

    public function close(DateTimeImmutable $closedAt): self
    {
        return new self(
            id: $this->id,
            employerId: $this->employerId,
            employerName: $this->employerName,
            title: $this->title,
            description: $this->description,
            location: $this->location,
            employmentType: $this->employmentType,
            category: $this->category,
            salary: $this->salary,
            currency: $this->currency,
            status: JobListingStatus::Closed,
            publishedAt: $this->publishedAt,
            createdAt: $this->createdAt,
            updatedAt: $closedAt,
            applicationsCount: $this->applicationsCount,
            shortlistedCount: $this->shortlistedCount,
        );
    }
}
