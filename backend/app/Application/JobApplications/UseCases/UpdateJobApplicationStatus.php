<?php

namespace App\Application\JobApplications\UseCases;

use App\Application\JobApplications\Contracts\JobApplicationNotifier;
use App\Application\JobApplications\Exceptions\JobApplicationAccessDenied;
use App\Application\JobApplications\Exceptions\JobApplicationNotFound;
use App\Domain\JobApplications\Entities\JobApplication;
use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Domain\JobApplications\Repositories\JobApplicationRepository;
use DateTimeImmutable;

final readonly class UpdateJobApplicationStatus
{
    public function __construct(
        private JobApplicationRepository $applications,
        private JobApplicationNotifier $notifier,
    ) {}

    public function execute(
        int $applicationId,
        int $employerId,
        JobApplicationStatus $status,
    ): JobApplication {
        $application = $this->applications->findById($applicationId) ?? throw new JobApplicationNotFound;

        if (! $application->belongsToEmployer($employerId)) {
            throw new JobApplicationAccessDenied;
        }

        if ($application->status === $status) {
            return $application;
        }

        $updated = $this->applications->save($application->transitionTo($status, new DateTimeImmutable));
        $this->notifier->notifyApplicantOfStatusChange($updated);

        return $updated;
    }
}
