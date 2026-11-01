<?php

namespace App\Application\JobApplications\Contracts;

use App\Application\JobApplications\DTOs\ResumeFileData;
use App\Application\JobApplications\DTOs\ResumeUploadData;
use App\Domain\JobApplications\ValueObjects\ResumeAttachment;

interface ResumeStorage
{
    public function store(int $applicantId, ResumeUploadData $upload): ResumeAttachment;

    public function read(ResumeAttachment $attachment): ?ResumeFileData;

    public function delete(string $path): void;
}
