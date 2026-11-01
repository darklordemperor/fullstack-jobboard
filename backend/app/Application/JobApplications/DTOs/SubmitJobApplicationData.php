<?php

namespace App\Application\JobApplications\DTOs;

final readonly class SubmitJobApplicationData
{
    public function __construct(
        public int $jobListingId,
        public int $applicantId,
        public string $coverLetter,
        public ?ResumeUploadData $resume,
    ) {}
}
