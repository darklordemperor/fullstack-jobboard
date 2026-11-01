<?php

namespace App\Http\Resources;

use App\Domain\Interviews\Entities\Interview;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterviewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var Interview $interview */
        $interview = $this->resource;

        return [
            'id' => $interview->id,
            'jobApplicationId' => $interview->jobApplicationId,
            'jobListing' => [
                'id' => $interview->jobListingId,
                'title' => $interview->jobTitle,
            ],
            'employer' => [
                'id' => $interview->employerId,
                'name' => $interview->employerName,
            ],
            'candidate' => [
                'id' => $interview->candidateId,
                'name' => $interview->candidateName,
                'email' => $interview->candidateEmail,
            ],
            'scheduledAt' => $this->utc($interview->scheduledAt),
            'endsAt' => $this->utc($interview->endsAt()),
            'durationMinutes' => $interview->durationMinutes,
            'timezone' => $interview->timezone,
            'location' => $interview->location,
            'notes' => $interview->notes,
            'status' => $interview->status->value,
            'confirmedAt' => $this->utc($interview->confirmedAt),
            'cancelledAt' => $this->utc($interview->cancelledAt),
            'completedAt' => $this->utc($interview->completedAt),
            'createdAt' => $this->utc($interview->createdAt),
            'updatedAt' => $this->utc($interview->updatedAt),
        ];
    }

    private function utc(?DateTimeImmutable $value): ?string
    {
        return $value?->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.u\Z');
    }
}
