<?php

namespace Database\Factories;

use App\Domain\Interviews\Enums\InterviewStatus;
use App\Models\Interview;
use App\Models\JobApplication;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Interview> */
class InterviewFactory extends Factory
{
    protected $model = Interview::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'job_application_id' => JobApplication::factory(),
            'employer_id' => fn (array $attributes): int => (int) JobApplication::query()
                ->with('jobListing:id,employer_id')
                ->findOrFail($attributes['job_application_id'])
                ->jobListing
                ->employer_id,
            'candidate_id' => fn (array $attributes): int => (int) JobApplication::query()
                ->findOrFail($attributes['job_application_id'])
                ->applicant_id,
            'scheduled_at' => now()->addDays(2),
            'duration_minutes' => 60,
            'timezone' => 'Asia/Bangkok',
            'location' => fake()->url(),
            'notes' => fake()->sentence(),
            'status' => InterviewStatus::Scheduled,
        ];
    }
}
