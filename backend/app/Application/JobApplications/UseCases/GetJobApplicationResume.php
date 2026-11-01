<?php

namespace App\Application\JobApplications\UseCases;

use App\Application\JobApplications\Contracts\ResumeStorage;
use App\Application\JobApplications\DTOs\ResumeFileData;
use App\Application\JobApplications\Exceptions\JobApplicationAccessDenied;
use App\Application\JobApplications\Exceptions\JobApplicationNotFound;
use App\Application\JobApplications\Exceptions\JobApplicationResumeNotFound;
use App\Domain\JobApplications\Repositories\JobApplicationRepository;

final readonly class GetJobApplicationResume
{
    public function __construct(
        private JobApplicationRepository $applications,
        private ResumeStorage $resumeStorage,
    ) {}

    public function execute(int $applicationId, int $requesterId, string $requesterRole): ResumeFileData
    {
        $application = $this->applications->findById($applicationId) ?? throw new JobApplicationNotFound;

        $isApplicant = $requesterRole === 'jobseeker' && $application->belongsToApplicant($requesterId);
        $isEmployer = $requesterRole === 'employer' && $application->belongsToEmployer($requesterId);

        if (! $isApplicant && ! $isEmployer) {
            throw new JobApplicationAccessDenied;
        }

        if ($application->resume === null) {
            throw new JobApplicationResumeNotFound;
        }

        return $this->resumeStorage->read($application->resume) ?? throw new JobApplicationResumeNotFound;
    }
}
