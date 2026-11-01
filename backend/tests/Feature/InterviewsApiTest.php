<?php

use App\Domain\Interviews\Enums\InterviewStatus;
use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\JobListing;
use App\Models\User;
use App\Notifications\InterviewScheduledNotification;
use App\Notifications\InterviewStatusChangedNotification;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

function interviewFixture(JobApplicationStatus $status = JobApplicationStatus::Shortlisted): array
{
    $employer = User::factory()->create(['role' => 'employer']);
    $candidate = User::factory()->create(['role' => 'jobseeker']);
    $job = JobListing::factory()->for($employer, 'employer')->published()->create();
    $application = JobApplication::factory()
        ->for($job, 'jobListing')
        ->for($candidate, 'applicant')
        ->status($status)
        ->create();

    return [$employer, $candidate, $application];
}

function validInterviewPayload(array $overrides = []): array
{
    return array_merge([
        'scheduledAt' => now()->addDays(2)->setTime(10, 0)->toIso8601String(),
        'durationMinutes' => 60,
        'timezone' => 'Asia/Bangkok',
        'location' => 'https://meet.example/interview',
        'notes' => 'Technical discussion and system design.',
    ], $overrides);
}

test('owner employer schedules a shortlisted candidate with a compact documented response', function () {
    Notification::fake();
    [$employer, $candidate, $application] = interviewFixture();
    Sanctum::actingAs($employer);

    $this->postJson("/api/v1/employer/applications/{$application->id}/interviews", validInterviewPayload())
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.jobApplicationId', $application->id)
        ->assertJsonPath('data.candidate.id', $candidate->id)
        ->assertJsonPath('data.status', InterviewStatus::Scheduled->value)
        ->assertJsonMissingPath('data.candidate.password')
        ->assertJsonStructure(['data' => [
            'id', 'jobApplicationId', 'jobListing', 'employer', 'candidate',
            'scheduledAt', 'endsAt', 'durationMinutes', 'timezone', 'location',
            'notes', 'status', 'confirmedAt', 'cancelledAt', 'completedAt',
        ]]);

    $this->assertDatabaseHas('interviews', [
        'job_application_id' => $application->id,
        'employer_id' => $employer->id,
        'candidate_id' => $candidate->id,
        'status' => InterviewStatus::Scheduled->value,
    ]);
    Notification::assertSentTo($candidate, InterviewScheduledNotification::class);
});

test('scheduling enforces role ownership application state and validation', function () {
    [$employer, , $application] = interviewFixture(JobApplicationStatus::Reviewing);
    $otherEmployer = User::factory()->create(['role' => 'employer']);

    Sanctum::actingAs($otherEmployer);
    $this->postJson("/api/v1/employer/applications/{$application->id}/interviews", validInterviewPayload())
        ->assertForbidden();

    Sanctum::actingAs($employer);
    $this->postJson("/api/v1/employer/applications/{$application->id}/interviews", validInterviewPayload())
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Only shortlisted applications can be scheduled for an interview.');

    $this->postJson("/api/v1/employer/applications/{$application->id}/interviews", validInterviewPayload([
        'scheduledAt' => now()->subHour()->toIso8601String(),
        'durationMinutes' => 10,
        'timezone' => 'Not/AZone',
        'location' => '',
    ]))->assertUnprocessable()
        ->assertJsonValidationErrors(['scheduledAt', 'durationMinutes', 'timezone', 'location']);
});

test('overlapping employer or candidate schedules are rejected while adjacent times are allowed', function () {
    Notification::fake();
    [$employer, $candidate, $application] = interviewFixture();
    $startsAt = now()->addDays(3)->setTime(10, 0)->startOfMinute();
    Interview::factory()->create([
        'job_application_id' => $application->id,
        'employer_id' => $employer->id,
        'candidate_id' => $candidate->id,
        'scheduled_at' => $startsAt,
        'duration_minutes' => 60,
    ]);
    Sanctum::actingAs($employer);

    $this->postJson("/api/v1/employer/applications/{$application->id}/interviews", validInterviewPayload([
        'scheduledAt' => $startsAt->copy()->addMinutes(30)->toIso8601String(),
    ]))->assertUnprocessable()
        ->assertJsonPath('message', 'The employer or candidate already has an overlapping interview.');

    $this->postJson("/api/v1/employer/applications/{$application->id}/interviews", validInterviewPayload([
        'scheduledAt' => $startsAt->copy()->addHour()->toIso8601String(),
    ]))->assertCreated();
});

test('candidate sees only owned interviews and can confirm a scheduled interview', function () {
    Notification::fake();
    [$employer, $candidate, $application] = interviewFixture();
    $interview = Interview::factory()->create([
        'job_application_id' => $application->id,
        'employer_id' => $employer->id,
        'candidate_id' => $candidate->id,
    ]);
    Interview::factory()->create();
    Sanctum::actingAs($candidate);

    $this->getJson('/api/v1/jobseeker/interviews?status=scheduled')
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.counts.total', 1)
        ->assertJsonPath('data.counts.scheduled', 1)
        ->assertJsonPath('data.counts.confirmed', 0)
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.items.0.id', $interview->id);

    $this->patchJson("/api/v1/jobseeker/interviews/{$interview->id}/confirm")
        ->assertSuccessful()
        ->assertJsonPath('data.status', InterviewStatus::Confirmed->value);

    Notification::assertSentTo($employer, InterviewStatusChangedNotification::class);
});

test('employer can reschedule cancel and list only owned interviews', function () {
    Notification::fake();
    [$employer, $candidate, $application] = interviewFixture();
    $interview = Interview::factory()->create([
        'job_application_id' => $application->id,
        'employer_id' => $employer->id,
        'candidate_id' => $candidate->id,
    ]);
    Sanctum::actingAs($employer);

    $this->patchJson("/api/v1/employer/interviews/{$interview->id}/reschedule", validInterviewPayload([
        'durationMinutes' => 45,
        'location' => 'Conference room 2',
    ]))->assertSuccessful()
        ->assertJsonPath('data.durationMinutes', 45)
        ->assertJsonPath('data.location', 'Conference room 2')
        ->assertJsonPath('data.status', InterviewStatus::Scheduled->value);

    $this->getJson('/api/v1/employer/interviews?status=scheduled')
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.counts.total', 1)
        ->assertJsonPath('data.counts.scheduled', 1)
        ->assertJsonPath('data.items.0.candidate.email', $candidate->email);

    $this->patchJson("/api/v1/employer/interviews/{$interview->id}/cancel")
        ->assertSuccessful()
        ->assertJsonPath('data.status', InterviewStatus::Cancelled->value);

    Notification::assertSentToTimes($candidate, InterviewScheduledNotification::class, 1);
    Notification::assertSentTo($candidate, InterviewStatusChangedNotification::class);
});

test('employer completes only a confirmed interview after it ends', function () {
    Notification::fake();
    [$employer, $candidate, $application] = interviewFixture();
    $interview = Interview::factory()->create([
        'job_application_id' => $application->id,
        'employer_id' => $employer->id,
        'candidate_id' => $candidate->id,
        'scheduled_at' => now()->subHours(2),
        'duration_minutes' => 60,
        'status' => InterviewStatus::Confirmed,
        'confirmed_at' => now()->subDays(2),
    ]);
    Sanctum::actingAs($employer);

    $this->patchJson("/api/v1/employer/interviews/{$interview->id}/complete")
        ->assertSuccessful()
        ->assertJsonPath('data.status', InterviewStatus::Completed->value);

    Notification::assertSentTo($candidate, InterviewStatusChangedNotification::class);
});
