<?php

namespace App\Domain\JobApplications\Repositories;

use App\Domain\JobApplications\Entities\JobApplication;
use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Domain\JobApplications\ValueObjects\JobApplicationPage;
use App\Domain\JobApplications\ValueObjects\JobApplicationStatusCounts;
use App\Domain\JobApplications\ValueObjects\ResumeAttachment;

interface JobApplicationRepository
{
    public function existsForApplicantAndJob(int $applicantId, int $jobListingId): bool;

    public function create(
        int $jobListingId,
        int $applicantId,
        string $coverLetter,
        ?ResumeAttachment $resume,
    ): JobApplication;

    public function searchByEmployerJob(
        int $employerId,
        int $jobListingId,
        ?JobApplicationStatus $status,
        int $page,
        int $perPage,
        ?string $search = null,
    ): JobApplicationPage;

    public function statusCountsByEmployerJob(int $employerId, int $jobListingId): JobApplicationStatusCounts;

    public function searchByApplicant(
        int $applicantId,
        ?JobApplicationStatus $status,
        int $page,
        int $perPage,
        ?int $jobListingId = null,
        ?string $search = null,
    ): JobApplicationPage;

    public function statusCountsByApplicant(int $applicantId): JobApplicationStatusCounts;

    public function findById(int $id): ?JobApplication;

    public function save(JobApplication $application): JobApplication;
}
