<?php

namespace App\Application\JobApplications\DTOs;

final readonly class ResumeUploadData
{
    public function __construct(
        public string $originalName,
        public string $mimeType,
        public int $size,
        public string $contents,
    ) {}
}
