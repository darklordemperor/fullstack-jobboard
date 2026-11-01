<?php

namespace App\Http\Resources;

use App\Domain\JobListings\Entities\JobListing;
use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployerJobListingSummaryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var JobListing $jobListing */
        $jobListing = $this->resource;

        return [
            'id' => $jobListing->id,
            'title' => $jobListing->title,
            'location' => $jobListing->location,
            'employmentType' => $jobListing->employmentType->value,
            'category' => $jobListing->category,
            'salary' => [
                'minimum' => $jobListing->salary->minimum,
                'maximum' => $jobListing->salary->maximum,
                'currency' => $jobListing->currency,
            ],
            'status' => $jobListing->status->value,
            'applicationsCount' => $jobListing->applicationsCount,
            'shortlistedCount' => $jobListing->shortlistedCount,
            'publishedAt' => $jobListing->publishedAt?->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.u\Z'),
            'updatedAt' => $jobListing->updatedAt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.u\Z'),
        ];
    }
}
