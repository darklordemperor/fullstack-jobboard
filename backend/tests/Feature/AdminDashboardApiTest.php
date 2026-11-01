<?php

use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Models\JobApplication;
use App\Models\JobListing;
use App\Models\User;
use Carbon\CarbonImmutable;

beforeEach(function () {
    CarbonImmutable::setTestNow('2026-10-30 12:00:00');
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

test('admin dashboard requires an authenticated admin', function () {
    $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();

    $employer = User::factory()->create(['role' => 'employer']);

    $this->actingAs($employer)
        ->getJson('/api/v1/admin/dashboard')
        ->assertForbidden();
});

test('admin dashboard returns compact real platform analytics', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'created_at' => '2026-10-01 08:00:00',
    ]);
    $previousEmployer = User::factory()->create([
        'role' => 'employer',
        'created_at' => '2026-09-10 08:00:00',
    ]);
    $previousJobseeker = User::factory()->create([
        'role' => 'jobseeker',
        'created_at' => '2026-09-12 08:00:00',
    ]);
    $currentEmployer = User::factory()->create([
        'role' => 'employer',
        'created_at' => '2026-10-05 08:00:00',
    ]);
    $currentJobseeker = User::factory()->unverified()->create([
        'role' => 'jobseeker',
        'created_at' => '2026-10-30 11:00:00',
    ]);

    $previousJob = JobListing::factory()->published()->create([
        'employer_id' => $previousEmployer->id,
        'title' => 'Previous Platform Engineer',
        'created_at' => '2026-09-15 08:00:00',
        'published_at' => '2026-09-16 08:00:00',
    ]);
    $currentJob = JobListing::factory()->published()->create([
        'employer_id' => $currentEmployer->id,
        'title' => 'Current Backend Engineer',
        'created_at' => '2026-10-10 08:00:00',
        'published_at' => '2026-10-11 08:00:00',
    ]);
    $secondCurrentJob = JobListing::factory()->published()->create([
        'employer_id' => $currentEmployer->id,
        'title' => 'Current Product Engineer',
        'created_at' => '2026-10-20 08:00:00',
        'published_at' => '2026-10-21 08:00:00',
    ]);

    JobApplication::factory()->status(JobApplicationStatus::Hired)->create([
        'job_listing_id' => $previousJob->id,
        'applicant_id' => $previousJobseeker->id,
        'created_at' => '2026-09-20 08:00:00',
        'status_changed_at' => '2026-09-25 08:00:00',
    ]);
    JobApplication::factory()->create([
        'job_listing_id' => $currentJob->id,
        'applicant_id' => $currentJobseeker->id,
        'created_at' => '2026-10-29 09:00:00',
        'status_changed_at' => '2026-10-29 09:00:00',
    ]);
    JobApplication::factory()->create([
        'job_listing_id' => $secondCurrentJob->id,
        'applicant_id' => $currentJobseeker->id,
        'created_at' => '2026-10-30 09:00:00',
        'status_changed_at' => '2026-10-30 09:00:00',
    ]);
    JobApplication::factory()->status(JobApplicationStatus::Hired)->create([
        'job_listing_id' => $currentJob->id,
        'applicant_id' => $previousJobseeker->id,
        'created_at' => '2026-10-30 10:00:00',
        'status_changed_at' => '2026-10-30 11:00:00',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/dashboard')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.stats.totalUsers.value', 4)
        ->assertJsonPath('data.stats.totalUsers.changePercent', 0)
        ->assertJsonPath('data.stats.totalEmployers.value', 2)
        ->assertJsonPath('data.stats.totalJobseekers.value', 2)
        ->assertJsonPath('data.stats.totalJobListings.value', 3)
        ->assertJsonPath('data.stats.totalJobListings.changePercent', 100)
        ->assertJsonPath('data.stats.applicationsToday.value', 2)
        ->assertJsonPath('data.stats.applicationsToday.changePercent', 100)
        ->assertJsonPath('data.stats.hiresThisMonth.value', 1)
        ->assertJsonPath('data.stats.hiresThisMonth.changePercent', 0)
        ->assertJsonPath('data.userDistribution.employers', 2)
        ->assertJsonPath('data.userDistribution.jobseekers', 2)
        ->assertJsonPath('data.growth.4.month', '2026-09')
        ->assertJsonPath('data.growth.4.newUsers', 2)
        ->assertJsonPath('data.growth.4.newJobListings', 1)
        ->assertJsonPath('data.growth.4.applications', 1)
        ->assertJsonPath('data.growth.5.month', '2026-10')
        ->assertJsonPath('data.growth.5.newUsers', 2)
        ->assertJsonPath('data.growth.5.newJobListings', 2)
        ->assertJsonPath('data.growth.5.applications', 3)
        ->assertJsonPath('data.latestUsers.0.id', $currentJobseeker->id)
        ->assertJsonPath('data.latestUsers.0.status', 'unverified')
        ->assertJsonPath('data.generatedAt', '2026-10-30T12:00:00.000000Z')
        ->assertJsonCount(6, 'data.growth')
        ->assertJsonCount(6, 'data.recentActivity')
        ->assertJsonCount(5, 'data.latestUsers')
        ->assertJsonMissingPath('data.latestUsers.0.password')
        ->assertJsonMissingPath('data.latestUsers.0.rememberToken');
});

test('admin user directory supports search, role, status filters, and pagination', function () {
    $admin = User::factory()->create([
        'name' => 'Platform Admin',
        'email' => 'admin@jobboard.com',
        'role' => 'admin',
    ]);
    $verifiedEmployer = User::factory()->create([
        'name' => 'Acme Hiring Team',
        'email' => 'hiring@acme.example',
        'role' => 'employer',
    ]);
    $unverifiedCandidate = User::factory()->unverified()->create([
        'name' => 'Jane Candidate',
        'email' => 'jane.candidate@example.com',
        'role' => 'jobseeker',
    ]);

    $this->getJson('/api/v1/admin/users')->assertUnauthorized();
    $this->actingAs($verifiedEmployer)->getJson('/api/v1/admin/users')->assertForbidden();

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/users?search=Jane&role=jobseeker&status=unverified&perPage=5')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.items.0.id', $unverifiedCandidate->id)
        ->assertJsonPath('data.items.0.name', 'Jane Candidate')
        ->assertJsonPath('data.items.0.role', 'jobseeker')
        ->assertJsonPath('data.items.0.status', 'unverified')
        ->assertJsonMissingPath('data.items.0.password');
});

test('admin can update a user role', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'jobseeker']);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$user->id}", [
            'role' => 'employer',
        ])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.role', 'employer');

    expect($user->fresh()->role)->toBe('employer');
});

test('admin can suspend and reactivate a user', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'jobseeker']);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$user->id}", [
            'suspended' => true,
        ])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'suspended');

    expect($user->fresh()->suspended_at)->not->toBeNull();

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$user->id}", [
            'suspended' => false,
        ])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'verified');

    expect($user->fresh()->suspended_at)->toBeNull();
});

test('admin cannot suspend their own account', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$admin->id}", [
            'suspended' => true,
        ])
        ->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'You cannot suspend your own account.');
});

test('admin cannot demote their own account', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$admin->id}", [
            'role' => 'jobseeker',
        ])
        ->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'You cannot demote your own admin account.');
});

test('suspended user cannot log in or access authenticated routes', function () {
    $suspendedUser = User::factory()->create([
        'email' => 'suspended@example.com',
        'password' => bcrypt('password123'),
        'suspended_at' => now(),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'suspended@example.com',
        'password' => 'password123',
    ])
        ->assertStatus(403)
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Your account has been suspended. Please contact support.');

    $this->actingAs($suspendedUser)
        ->getJson('/api/v1/me')
        ->assertStatus(403)
        ->assertJsonPath('message', 'Your account has been suspended. Please contact support.');
});
