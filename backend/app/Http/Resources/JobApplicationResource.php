<?php

namespace App\Http\Resources;

use App\Domain\JobApplications\Entities\JobApplication;
use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobApplicationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var JobApplication $application */
        $application = $this->resource;

        return [
            'id' => $application->id,
            'jobListing' => [
                'id' => $application->jobListingId,
                'title' => $application->jobTitle,
            ],
            'applicant' => [
                'id' => $application->applicantId,
                'name' => $application->applicantName,
                'email' => $application->applicantEmail,
            ],
            'coverLetter' => $application->coverLetter,
            'resume' => [
                'available' => $application->resume !== null,
                'originalName' => $application->resume?->originalName,
                'size' => $application->resume?->size,
            ],
            'status' => $application->status->value,
            'statusChangedAt' => $application->statusChangedAt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.u\Z'),
            'withdrawnAt' => $application->withdrawnAt?->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.u\Z'),
            'appliedAt' => $application->createdAt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.u\Z'),
            'updatedAt' => $application->updatedAt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.u\Z'),
        ];
    }
}
