<?php

namespace App\Application\JobApplications\Contracts;

use App\Domain\JobApplications\Entities\JobApplication;

interface JobApplicationNotifier
{
    public function notifyEmployerOfNewApplication(JobApplication $application): void;

    public function notifyEmployerOfWithdrawal(JobApplication $application): void;

    public function notifyApplicantOfStatusChange(JobApplication $application): void;
}
