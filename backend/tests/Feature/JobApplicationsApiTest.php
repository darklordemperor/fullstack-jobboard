<?php

use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Models\JobApplication;
use App\Models\JobListing;
use App\Models\User;
use App\Notifications\JobApplicationStatusChangedNotification;
use App\Notifications\JobApplicationWithdrawnNotification;
use App\Notifications\NewJobApplicationNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

function validApplicationPayload(array $overrides = []): array
{
    return array_merge([
        'coverLetter' => str_repeat('I have relevant backend experience and would value the opportunity to contribute. ', 2),
    ], $overrides);
}

test('jobseeker can apply once to a published job', function () {
    $jobListing = JobListing::factory()->published()->create();
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);
    Sanctum::actingAs($jobseeker);

    $this->postJson("/api/v1/job-listings/{$jobListing->id}/applications", validApplicationPayload())
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.jobListing.id', $jobListing->id)
        ->assertJsonPath('data.applicant.id', $jobseeker->id)
        ->assertJsonPath('data.status', JobApplicationStatus::Submitted->value)
        ->assertJsonStructure(['data' => ['id', 'coverLetter', 'statusChangedAt', 'appliedAt']]);

    $this->assertDatabaseHas('job_applications', [
        'job_listing_id' => $jobListing->id,
        'applicant_id' => $jobseeker->id,
        'status' => JobApplicationStatus::Submitted->value,
    ]);
});

test('jobseeker can attach a private PDF resume and employer is notified', function () {
    Storage::fake('local');
    Notification::fake();
    $employer = User::factory()->create(['role' => 'employer']);
    $jobListing = JobListing::factory()->for($employer, 'employer')->published()->create();
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);
    Sanctum::actingAs($jobseeker);

    $response = $this->post("/api/v1/job-listings/{$jobListing->id}/applications", [
        ...validApplicationPayload(),
        'resume' => UploadedFile::fake()->create('jane-resume.pdf', 200, 'application/pdf'),
    ], ['Accept' => 'application/json']);

    $response->assertCreated()
        ->assertJsonPath('data.resume.available', true)
        ->assertJsonPath('data.resume.originalName', 'jane-resume.pdf');

    $application = JobApplication::query()->sole();
    Storage::disk('local')->assertExists($application->resume_path);
    Notification::assertSentTo($employer, NewJobApplicationNotification::class);
});

test('application submission validates role payload publication and duplicates', function () {
    $published = JobListing::factory()->published()->create();
    $draft = JobListing::factory()->create();
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);
    Sanctum::actingAs($jobseeker);

    $this->postJson("/api/v1/job-listings/{$published->id}/applications", ['coverLetter' => 'Too short'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('coverLetter');

    $this->postJson("/api/v1/job-listings/{$draft->id}/applications", validApplicationPayload())
        ->assertNotFound();

    $this->postJson("/api/v1/job-listings/{$published->id}/applications", validApplicationPayload())
        ->assertCreated();
    $this->postJson("/api/v1/job-listings/{$published->id}/applications", validApplicationPayload())
        ->assertUnprocessable()
        ->assertJsonPath('message', 'You have already applied to this job listing.');

    $this->assertDatabaseCount('job_applications', 1);

    Sanctum::actingAs(User::factory()->create(['role' => 'employer']));
    $this->postJson("/api/v1/job-listings/{$published->id}/applications", validApplicationPayload())
        ->assertForbidden();
});

test('employer lists only applications for an owned job with filters counts and pagination', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $otherEmployer = User::factory()->create(['role' => 'employer']);
    $ownedJob = JobListing::factory()->for($employer, 'employer')->published()->create();
    $otherJob = JobListing::factory()->for($otherEmployer, 'employer')->published()->create();

    JobApplication::factory()->for($ownedJob, 'jobListing')->create();
    JobApplication::factory()->for($ownedJob, 'jobListing')->status(JobApplicationStatus::Shortlisted)->create();
    JobApplication::factory()->for($otherJob, 'jobListing')->status(JobApplicationStatus::Shortlisted)->create();

    Sanctum::actingAs($employer);

    $this->getJson("/api/v1/employer/job-listings/{$ownedJob->id}/applications?status=shortlisted&page=1&perPage=10")
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.counts.total', 2)
        ->assertJsonPath('data.counts.submitted', 1)
        ->assertJsonPath('data.counts.shortlisted', 1)
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.items.0.status', JobApplicationStatus::Shortlisted->value)
        ->assertJsonStructure(['data' => ['items' => ['*' => ['applicant' => ['id', 'name', 'email']]]]]);

    $this->getJson("/api/v1/employer/job-listings/{$otherJob->id}/applications")
        ->assertForbidden();
});

test('employer can filter applications by candidate name, email, or cover letter keyword', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $ownedJob = JobListing::factory()->for($employer, 'employer')->published()->create();

    $alice = User::factory()->create([
        'name' => 'Alice Kubernetes',
        'email' => 'alice.k8s@example.com',
        'role' => 'jobseeker',
    ]);
    $bob = User::factory()->create([
        'name' => 'Bob Frontend',
        'email' => 'bob.ui@example.com',
        'role' => 'jobseeker',
    ]);

    JobApplication::factory()->for($ownedJob, 'jobListing')->for($alice, 'applicant')->create([
        'cover_letter' => str_repeat('Built high-throughput distributed payment pipelines in Go. ', 2),
    ]);
    JobApplication::factory()->for($ownedJob, 'jobListing')->for($bob, 'applicant')->create([
        'cover_letter' => str_repeat('Designed accessible design systems and React component libraries. ', 2),
    ]);

    Sanctum::actingAs($employer);

    $this->getJson("/api/v1/employer/job-listings/{$ownedJob->id}/applications?search=Kubernetes")
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.counts.total', 2)
        ->assertJsonPath('data.items.0.applicant.email', 'alice.k8s@example.com');

    $this->getJson("/api/v1/employer/job-listings/{$ownedJob->id}/applications?search=accessible+design")
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.applicant.email', 'bob.ui@example.com');
});

test('only the owner employer can move applications through allowed statuses', function () {
    Notification::fake();
    $employer = User::factory()->create(['role' => 'employer']);
    $otherEmployer = User::factory()->create(['role' => 'employer']);
    $jobListing = JobListing::factory()->for($employer, 'employer')->published()->create();
    $application = JobApplication::factory()->for($jobListing, 'jobListing')->create();

    Sanctum::actingAs($otherEmployer);
    $this->patchJson("/api/v1/employer/applications/{$application->id}/status", [
        'status' => JobApplicationStatus::Reviewing->value,
    ])->assertForbidden();

    Sanctum::actingAs($employer);
    $this->patchJson("/api/v1/employer/applications/{$application->id}/status", [
        'status' => JobApplicationStatus::Reviewing->value,
    ])->assertSuccessful()
        ->assertJsonPath('data.status', JobApplicationStatus::Reviewing->value);

    $this->patchJson("/api/v1/employer/applications/{$application->id}/status", [
        'status' => JobApplicationStatus::Hired->value,
    ])->assertUnprocessable()
        ->assertJsonPath('errors.status.0', 'Application cannot move from reviewing to hired.');

    $this->patchJson("/api/v1/employer/applications/{$application->id}/status", [
        'status' => 'unknown',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('status');

    $this->assertDatabaseHas('job_applications', [
        'id' => $application->id,
        'status' => JobApplicationStatus::Reviewing->value,
    ]);
    Notification::assertSentTo($application->applicant, JobApplicationStatusChangedNotification::class);
});

test('jobseekers cannot access employer application review', function () {
    $jobListing = JobListing::factory()->published()->create();
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);
    Sanctum::actingAs($jobseeker);

    $this->getJson("/api/v1/employer/job-listings/{$jobListing->id}/applications")
        ->assertForbidden();
});

test('jobseeker history is owner scoped filterable and includes lifecycle counts', function () {
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);
    $otherJobseeker = User::factory()->create(['role' => 'jobseeker']);
    JobApplication::factory()->for($jobseeker, 'applicant')->create();
    JobApplication::factory()->for($jobseeker, 'applicant')->status(JobApplicationStatus::Shortlisted)->create();
    JobApplication::factory()->for($otherJobseeker, 'applicant')->status(JobApplicationStatus::Shortlisted)->create();
    Sanctum::actingAs($jobseeker);

    $this->getJson('/api/v1/jobseeker/applications?status=shortlisted&page=1&perPage=10')
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.counts.total', 2)
        ->assertJsonPath('data.counts.submitted', 1)
        ->assertJsonPath('data.counts.shortlisted', 1)
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.items.0.applicant.id', $jobseeker->id);
});

test('jobseeker can search application history by job title, location, or cover letter keyword', function () {
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);
    $platformJob = JobListing::factory()->published()->create([
        'title' => 'Cloud Infrastructure Architect',
        'location' => 'Singapore',
        'category' => 'DevOps',
    ]);
    $mobileJob = JobListing::factory()->published()->create([
        'title' => 'iOS Swift Engineer',
        'location' => 'Bangkok',
        'category' => 'Mobile',
    ]);

    JobApplication::factory()->for($platformJob, 'jobListing')->for($jobseeker, 'applicant')->create([
        'cover_letter' => str_repeat('Managed multi-region Terraform and Kubernetes clusters. ', 2),
    ]);
    JobApplication::factory()->for($mobileJob, 'jobListing')->for($jobseeker, 'applicant')->create([
        'cover_letter' => str_repeat('Shipped SwiftUI consumer banking applications. ', 2),
    ]);

    Sanctum::actingAs($jobseeker);

    $this->getJson('/api/v1/jobseeker/applications?search=Infrastructure')
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.counts.total', 2)
        ->assertJsonPath('data.items.0.jobListing.title', 'Cloud Infrastructure Architect');

    $this->getJson('/api/v1/jobseeker/applications?search=SwiftUI')
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.jobListing.title', 'iOS Swift Engineer');
});

test('jobseeker can filter applications by jobListingId to inspect existing application state on a role detail page', function () {
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);
    $appliedJob = JobListing::factory()->published()->create();
    $otherJob = JobListing::factory()->published()->create();

    $application = JobApplication::factory()
        ->for($appliedJob, 'jobListing')
        ->for($jobseeker, 'applicant')
        ->status(JobApplicationStatus::Shortlisted)
        ->create();
    JobApplication::factory()
        ->for($otherJob, 'jobListing')
        ->for($jobseeker, 'applicant')
        ->create();

    Sanctum::actingAs($jobseeker);

    $this->getJson("/api/v1/jobseeker/applications?jobListingId={$appliedJob->id}&perPage=1")
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.items.0.id', $application->id)
        ->assertJsonPath('data.items.0.jobListing.id', $appliedJob->id)
        ->assertJsonPath('data.items.0.status', JobApplicationStatus::Shortlisted->value);
});

test('candidate can withdraw an active application but not another or terminal application', function () {
    Notification::fake();
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);
    $otherJobseeker = User::factory()->create(['role' => 'jobseeker']);
    $active = JobApplication::factory()->for($jobseeker, 'applicant')->create();
    $terminal = JobApplication::factory()
        ->for($jobseeker, 'applicant')
        ->status(JobApplicationStatus::Rejected)
        ->create();

    Sanctum::actingAs($otherJobseeker);
    $this->patchJson("/api/v1/jobseeker/applications/{$active->id}/withdraw")
        ->assertForbidden();

    Sanctum::actingAs($jobseeker);
    $this->patchJson("/api/v1/jobseeker/applications/{$active->id}/withdraw")
        ->assertSuccessful()
        ->assertJsonPath('data.status', JobApplicationStatus::Withdrawn->value);
    $this->patchJson("/api/v1/jobseeker/applications/{$terminal->id}/withdraw")
        ->assertUnprocessable()
        ->assertJsonPath('errors.status.0', 'Application cannot be withdrawn from rejected status.');

    Notification::assertSentTo($active->jobListing->employer, JobApplicationWithdrawnNotification::class);
});

test('resume download is private to the candidate and owner employer', function () {
    Storage::fake('local');
    $employer = User::factory()->create(['role' => 'employer']);
    $jobListing = JobListing::factory()->for($employer, 'employer')->published()->create();
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);
    $application = JobApplication::factory()
        ->for($jobListing, 'jobListing')
        ->for($jobseeker, 'applicant')
        ->withResume()
        ->create();
    Storage::disk('local')->put($application->resume_path, 'pdf-contents');

    Sanctum::actingAs(User::factory()->create(['role' => 'jobseeker']));
    $this->get("/api/v1/job-applications/{$application->id}/resume", ['Accept' => 'application/pdf'])
        ->assertForbidden();

    Sanctum::actingAs($jobseeker);
    $this->get("/api/v1/job-applications/{$application->id}/resume")
        ->assertSuccessful()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('cache-control', 'no-store, private');

    Sanctum::actingAs($employer);
    $this->get("/api/v1/job-applications/{$application->id}/resume")
        ->assertSuccessful();
});

test('resume upload accepts only PDF files up to five megabytes', function () {
    Storage::fake('local');
    $jobListing = JobListing::factory()->published()->create();
    Sanctum::actingAs(User::factory()->create(['role' => 'jobseeker']));

    $this->post("/api/v1/job-listings/{$jobListing->id}/applications", [
        ...validApplicationPayload(),
        'resume' => UploadedFile::fake()->create('resume.exe', 10, 'application/octet-stream'),
    ], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('resume');
});
