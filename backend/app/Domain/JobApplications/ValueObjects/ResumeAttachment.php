<?php

namespace App\Domain\JobApplications\ValueObjects;

final readonly class ResumeAttachment
{
    public function __construct(
        public string $path,
        public string $originalName,
        public string $mimeType,
        public int $size,
    ) {}
}
