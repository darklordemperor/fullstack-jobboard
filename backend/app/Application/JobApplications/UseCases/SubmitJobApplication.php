<?php

namespace App\Application\JobApplications\UseCases;

use App\Application\JobApplications\Contracts\JobApplicationNotifier;
use App\Application\JobApplications\Contracts\ResumeStorage;
use App\Application\JobApplications\DTOs\SubmitJobApplicationData;
use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Domain\JobApplications\Entities\JobApplication;
use App\Domain\JobApplications\Repositories\JobApplicationRepository;
use App\Domain\JobListings\Repositories\JobListingRepository;
use DomainException;
use Throwable;

final readonly class SubmitJobApplication
{
    public function __construct(
        private JobApplicationRepository $applications,
        private JobListingRepository $jobListings,
        private ResumeStorage $resumeStorage,
        private JobApplicationNotifier $notifier,
    ) {}

    public function execute(SubmitJobApplicationData $data): JobApplication
    {
        $this->jobListings->findPublishedById($data->jobListingId) ?? throw new JobListingNotFound;

        if ($this->applications->existsForApplicantAndJob($data->applicantId, $data->jobListingId)) {
            throw new DomainException('You have already applied to this job listing.');
        }

        $resume = $data->resume === null
            ? null
            : $this->resumeStorage->store($data->applicantId, $data->resume);

        try {
            $application = $this->applications->create(
                jobListingId: $data->jobListingId,
                applicantId: $data->applicantId,
                coverLetter: $data->coverLetter,
                resume: $resume,
            );
        } catch (Throwable $exception) {
            if ($resume !== null) {
                $this->resumeStorage->delete($resume->path);
            }

            throw $exception;
        }

        $this->notifier->notifyEmployerOfNewApplication($application);

        return $application;
    }
}
