<?php

use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Domain\JobListings\Enums\EmploymentType;
use App\Domain\JobListings\Enums\JobListingStatus;
use App\Models\JobApplication;
use App\Models\JobListing;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function validJobListingPayload(array $overrides = []): array
{
    return array_merge([
        'title' => 'Senior Backend Engineer',
        'description' => str_repeat('Build reliable payment services and mentor the engineering team. ', 2),
        'location' => 'Remote',
        'employmentType' => EmploymentType::Remote->value,
        'category' => 'IT',
        'salaryMinimum' => 90000,
        'salaryMaximum' => 150000,
    ], $overrides);
}

test('public search returns only published compact listings with filters and pagination', function () {
    $employer = User::factory()->create(['name' => 'Ascend Money', 'role' => 'employer']);

    JobListing::factory()->for($employer, 'employer')->published()->create([
        'title' => 'Backend Engineer, Payments',
        'location' => 'Remote',
        'employment_type' => EmploymentType::Remote,
        'category' => 'IT',
        'salary_minimum' => 85000,
        'salary_maximum' => 145000,
    ]);
    JobListing::factory()->for($employer, 'employer')->create(['title' => 'Draft Backend Role']);
    JobListing::factory()->for($employer, 'employer')->closed()->create(['title' => 'Closed Backend Role']);

    $this->getJson('/api/v1/job-listings?keyword=backend&location=Remote&employmentTypes[]=remote&category=IT&salaryCap=90000&perPage=10')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.title', 'Backend Engineer, Payments')
        ->assertJsonPath('data.items.0.employerName', 'Ascend Money')
        ->assertJsonPath('data.items.0.salary.currency', 'THB')
        ->assertJsonMissingPath('data.items.0.description')
        ->assertJsonMissingPath('data.items.0.employerId')
        ->assertJsonPath('data.facets.employmentTypes.3', EmploymentType::Remote->value);
});

test('search escapes wildcards so percent or underscore are treated as literals', function () {
    $employer = User::factory()->create(['name' => 'Tech Corp', 'role' => 'employer']);
    JobListing::factory()->for($employer, 'employer')->published()->create([
        'title' => 'C++ 100% Remote Role',
    ]);
    JobListing::factory()->for($employer, 'employer')->published()->create([
        'title' => 'Java Standard Role',
    ]);

    $this->getJson('/api/v1/job-listings?keyword=100%25')
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.title', 'C++ 100% Remote Role');

    $this->getJson('/api/v1/job-listings?keyword=%25')
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.title', 'C++ 100% Remote Role');
});

test('public detail returns a published listing and hides drafts', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $published = JobListing::factory()->for($employer, 'employer')->published()->create();
    $draft = JobListing::factory()->for($employer, 'employer')->create();

    $this->getJson("/api/v1/job-listings/{$published->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.id', $published->id)
        ->assertJsonPath('data.description', $published->description);

    $this->getJson("/api/v1/job-listings/{$draft->id}")
        ->assertNotFound()
        ->assertJsonPath('success', false);
});

test('employer list is scoped to the owner with status counts and compact rows', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $otherEmployer = User::factory()->create(['role' => 'employer']);
    $draft = JobListing::factory()->for($employer, 'employer')->create(['title' => 'Owned Draft']);
    $published = JobListing::factory()->for($employer, 'employer')->published()->create(['title' => 'Owned Published']);
    JobApplication::factory()->for($published, 'jobListing')->create();
    JobApplication::factory()->for($published, 'jobListing')->status(JobApplicationStatus::Shortlisted)->create();
    JobListing::factory()->for($employer, 'employer')->closed()->create(['title' => 'Owned Closed']);
    JobListing::factory()->for($otherEmployer, 'employer')->published()->create(['title' => 'Other Employer Role']);
    Sanctum::actingAs($employer);

    $this->getJson('/api/v1/employer/job-listings?status=published&perPage=10')
        ->assertSuccessful()
        ->assertJsonPath('data.counts.total', 3)
        ->assertJsonPath('data.counts.draft', 1)
        ->assertJsonPath('data.counts.published', 1)
        ->assertJsonPath('data.counts.closed', 1)
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.id', $published->id)
        ->assertJsonPath('data.items.0.applicationsCount', 2)
        ->assertJsonPath('data.items.0.shortlistedCount', 1)
        ->assertJsonMissingPath('data.items.0.description')
        ->assertJsonMissing(['Other Employer Role']);

    $this->getJson("/api/v1/employer/job-listings/{$draft->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.title', 'Owned Draft')
        ->assertJsonPath('data.status', JobListingStatus::Draft->value);
});

test('employer can filter owned listings by keyword across title location and category', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $golangJob = JobListing::factory()->for($employer, 'employer')->published()->create([
        'title' => 'Staff Go Distributed Systems Engineer',
        'location' => 'Bangkok',
        'category' => 'Backend',
    ]);
    $designJob = JobListing::factory()->for($employer, 'employer')->create([
        'title' => 'Principal Product Designer',
        'location' => 'Chiang Mai',
        'category' => 'Design',
    ]);
    Sanctum::actingAs($employer);

    $this->getJson('/api/v1/employer/job-listings?search=Distributed&perPage=10')
        ->assertSuccessful()
        ->assertJsonPath('data.counts.total', 2)
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.id', $golangJob->id);

    $this->getJson('/api/v1/employer/job-listings?search=Chiang+Mai&perPage=10')
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.id', $designJob->id);
});

test('employer can create update publish and close an owned listing', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    Sanctum::actingAs($employer);

    $created = $this->postJson('/api/v1/employer/job-listings', validJobListingPayload())
        ->assertCreated()
        ->assertJsonPath('data.status', JobListingStatus::Draft->value)
        ->json('data');

    $jobListingId = $created['id'];

    $this->putJson("/api/v1/employer/job-listings/{$jobListingId}", validJobListingPayload([
        'title' => 'Principal Backend Engineer',
    ]))->assertSuccessful()
        ->assertJsonPath('data.title', 'Principal Backend Engineer');

    $this->postJson("/api/v1/employer/job-listings/{$jobListingId}/publish")
        ->assertSuccessful()
        ->assertJsonPath('data.status', JobListingStatus::Published->value)
        ->assertJsonPath('message', 'Job listing published.');

    $this->getJson("/api/v1/job-listings/{$jobListingId}")->assertSuccessful();

    $this->postJson("/api/v1/employer/job-listings/{$jobListingId}/close")
        ->assertSuccessful()
        ->assertJsonPath('data.status', JobListingStatus::Closed->value);

    $this->getJson("/api/v1/job-listings/{$jobListingId}")->assertNotFound();
});

test('employers cannot manage another employers listing', function () {
    $owner = User::factory()->create(['role' => 'employer']);
    $otherEmployer = User::factory()->create(['role' => 'employer']);
    $jobListing = JobListing::factory()->for($owner, 'employer')->create();
    Sanctum::actingAs($otherEmployer);

    $this->putJson("/api/v1/employer/job-listings/{$jobListing->id}", validJobListingPayload())
        ->assertForbidden()
        ->assertJsonPath('success', false);

    $this->getJson("/api/v1/employer/job-listings/{$jobListing->id}")
        ->assertForbidden()
        ->assertJsonPath('success', false);
});

test('jobseeker cannot create a listing and salary range is validated', function () {
    Sanctum::actingAs(User::factory()->create(['role' => 'jobseeker']));
    $this->getJson('/api/v1/employer/job-listings')->assertForbidden();
    $this->postJson('/api/v1/employer/job-listings', validJobListingPayload())->assertForbidden();

    Sanctum::actingAs(User::factory()->create(['role' => 'employer']));
    $this->postJson('/api/v1/employer/job-listings', validJobListingPayload([
        'salaryMinimum' => 100000,
        'salaryMaximum' => 50000,
    ]))->assertUnprocessable()
        ->assertJsonValidationErrors(['salaryMaximum']);
});

test('jobseeker can list save and remove published job listings while non-jobseekers and non-published listings are rejected', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);
    $otherJobseeker = User::factory()->create(['role' => 'jobseeker']);

    $publishedFirst = JobListing::factory()->for($employer, 'employer')->published()->create();
    $publishedSecond = JobListing::factory()->for($employer, 'employer')->published()->create();
    $draft = JobListing::factory()->for($employer, 'employer')->create();

    $this->getJson('/api/v1/jobseeker/saved-jobs')->assertUnauthorized();

    Sanctum::actingAs($employer);
    $this->getJson('/api/v1/jobseeker/saved-jobs')->assertForbidden();
    $this->postJson("/api/v1/jobseeker/saved-jobs/{$publishedFirst->id}")->assertForbidden();
    $this->deleteJson("/api/v1/jobseeker/saved-jobs/{$publishedFirst->id}")->assertForbidden();

    Sanctum::actingAs($jobseeker);

    $this->getJson('/api/v1/jobseeker/saved-jobs')
        ->assertSuccessful()
        ->assertJsonPath('data.jobListingIds', []);

    $this->postJson("/api/v1/jobseeker/saved-jobs/{$publishedFirst->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.jobListingIds', [$publishedFirst->id]);

    $this->postJson("/api/v1/jobseeker/saved-jobs/{$publishedFirst->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.jobListingIds', [$publishedFirst->id]);

    $this->postJson("/api/v1/jobseeker/saved-jobs/{$publishedSecond->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.jobListingIds', [$publishedSecond->id, $publishedFirst->id]);

    $this->postJson("/api/v1/jobseeker/saved-jobs/{$draft->id}")
        ->assertNotFound()
        ->assertJsonPath('success', false);

    Sanctum::actingAs($otherJobseeker);
    $this->getJson('/api/v1/jobseeker/saved-jobs')
        ->assertSuccessful()
        ->assertJsonPath('data.jobListingIds', []);

    Sanctum::actingAs($jobseeker);
    $this->deleteJson("/api/v1/jobseeker/saved-jobs/{$publishedFirst->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.jobListingIds', [$publishedSecond->id]);
});

test('public search supports savedOnly filter for authenticated jobseekers and rejects guests or non-jobseekers', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $jobseeker = User::factory()->create(['role' => 'jobseeker']);

    $savedRole = JobListing::factory()->for($employer, 'employer')->published()->create([
        'title' => 'Saved Platform Role',
    ]);
    JobListing::factory()->for($employer, 'employer')->published()->create([
        'title' => 'Unsaved Frontend Role',
    ]);

    $this->getJson('/api/v1/job-listings?savedOnly=true')->assertUnauthorized();

    Sanctum::actingAs($employer);
    $this->getJson('/api/v1/job-listings?savedOnly=true')->assertForbidden();

    Sanctum::actingAs($jobseeker);
    $this->postJson("/api/v1/jobseeker/saved-jobs/{$savedRole->id}")->assertSuccessful();

    $this->getJson('/api/v1/job-listings?savedOnly=true&perPage=10')
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.items.0.id', $savedRole->id)
        ->assertJsonPath('data.items.0.title', 'Saved Platform Role');
});
