<?php

namespace Database\Factories;

use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Models\JobApplication;
use App\Models\JobListing;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobApplication>
 */
class JobApplicationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'job_listing_id' => JobListing::factory()->published(),
            'applicant_id' => User::factory()->state(['role' => 'jobseeker']),
            'cover_letter' => fake()->paragraphs(3, true),
            'status' => JobApplicationStatus::Submitted,
            'status_changed_at' => now(),
        ];
    }

    public function status(JobApplicationStatus $status): static
    {
        return $this->state(fn (): array => [
            'status' => $status,
            'status_changed_at' => now(),
        ]);
    }

    public function withResume(): static
    {
        return $this->state(fn (): array => [
            'resume_path' => 'resumes/test/resume.pdf',
            'resume_original_name' => 'resume.pdf',
            'resume_mime_type' => 'application/pdf',
            'resume_size' => 1024,
        ]);
    }
}
