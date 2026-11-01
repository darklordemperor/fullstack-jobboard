<?php

namespace App\Application\JobApplications\UseCases;

use App\Application\JobApplications\Contracts\JobApplicationNotifier;
use App\Application\JobApplications\Exceptions\JobApplicationAccessDenied;
use App\Application\JobApplications\Exceptions\JobApplicationNotFound;
use App\Domain\JobApplications\Entities\JobApplication;
use App\Domain\JobApplications\Repositories\JobApplicationRepository;
use DateTimeImmutable;

final readonly class WithdrawJobApplication
{
    public function __construct(
        private JobApplicationRepository $applications,
        private JobApplicationNotifier $notifier,
    ) {}

    public function execute(int $applicationId, int $applicantId): JobApplication
    {
        $application = $this->applications->findById($applicationId) ?? throw new JobApplicationNotFound;

        if (! $application->belongsToApplicant($applicantId)) {
            throw new JobApplicationAccessDenied;
        }

        $withdrawn = $this->applications->save($application->withdraw(new DateTimeImmutable));
        $this->notifier->notifyEmployerOfWithdrawal($withdrawn);

        return $withdrawn;
    }
}
