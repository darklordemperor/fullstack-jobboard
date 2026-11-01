<?php

namespace App\Application\JobApplications\DTOs;

final readonly class ResumeFileData
{
    public function __construct(
        public string $originalName,
        public string $mimeType,
        public int $size,
        public string $contents,
    ) {}
}
