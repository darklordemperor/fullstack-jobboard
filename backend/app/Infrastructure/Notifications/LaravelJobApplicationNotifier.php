<?php

namespace App\Infrastructure\Notifications;

use App\Application\JobApplications\Contracts\JobApplicationNotifier;
use App\Domain\JobApplications\Entities\JobApplication;
use App\Models\User;
use App\Notifications\JobApplicationStatusChangedNotification;
use App\Notifications\JobApplicationWithdrawnNotification;
use App\Notifications\NewJobApplicationNotification;

final class LaravelJobApplicationNotifier implements JobApplicationNotifier
{
    public function notifyEmployerOfNewApplication(JobApplication $application): void
    {
        User::query()->find($application->employerId)?->notify(new NewJobApplicationNotification(
            applicantName: $application->applicantName,
            jobTitle: $application->jobTitle,
        ));
    }

    public function notifyEmployerOfWithdrawal(JobApplication $application): void
    {
        User::query()->find($application->employerId)?->notify(new JobApplicationWithdrawnNotification(
            applicantName: $application->applicantName,
            jobTitle: $application->jobTitle,
        ));
    }

    public function notifyApplicantOfStatusChange(JobApplication $application): void
    {
        User::query()->find($application->applicantId)?->notify(new JobApplicationStatusChangedNotification(
            jobTitle: $application->jobTitle,
            status: $application->status->value,
        ));
    }
}
