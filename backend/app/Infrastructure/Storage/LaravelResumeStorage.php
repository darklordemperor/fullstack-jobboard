<?php

namespace App\Infrastructure\Storage;

use App\Application\JobApplications\Contracts\ResumeStorage;
use App\Application\JobApplications\DTOs\ResumeFileData;
use App\Application\JobApplications\DTOs\ResumeUploadData;
use App\Domain\JobApplications\ValueObjects\ResumeAttachment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

final class LaravelResumeStorage implements ResumeStorage
{
    public function store(int $applicantId, ResumeUploadData $upload): ResumeAttachment
    {
        $path = "resumes/{$applicantId}/".Str::uuid().'.pdf';

        if (! Storage::disk('local')->put($path, $upload->contents)) {
            throw new RuntimeException('Resume could not be stored.');
        }

        return new ResumeAttachment(
            path: $path,
            originalName: Str::limit(basename(str_replace('\\', '/', $upload->originalName)), 200, ''),
            mimeType: $upload->mimeType,
            size: $upload->size,
        );
    }

    public function read(ResumeAttachment $attachment): ?ResumeFileData
    {
        $disk = Storage::disk('local');

        if (! $disk->exists($attachment->path)) {
            return null;
        }

        return new ResumeFileData(
            originalName: $attachment->originalName,
            mimeType: $attachment->mimeType,
            size: $attachment->size,
            contents: $disk->get($attachment->path),
        );
    }

    public function delete(string $path): void
    {
        Storage::disk('local')->delete($path);
    }
}
