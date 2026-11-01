<?php

use App\Domain\JobApplications\Entities\JobApplication;
use App\Domain\JobApplications\Enums\JobApplicationStatus;

function submittedApplication(): JobApplication
{
    $now = new DateTimeImmutable('2026-10-29T00:00:00+00:00');

    return new JobApplication(
        id: 1,
        jobListingId: 4,
        jobTitle: 'Backend Engineer',
        employerId: 2,
        applicantId: 8,
        applicantName: 'Jane Candidate',
        applicantEmail: 'jane@example.com',
        coverLetter: str_repeat('Relevant experience. ', 4),
        resume: null,
        status: JobApplicationStatus::Submitted,
        statusChangedAt: $now,
        withdrawnAt: null,
        createdAt: $now,
        updatedAt: $now,
    );
}

test('application follows the review lifecycle', function () {
    $application = submittedApplication();
    $reviewed = $application->transitionTo(
        JobApplicationStatus::Reviewing,
        new DateTimeImmutable('2026-10-29T01:00:00+00:00'),
    );
    $shortlisted = $reviewed->transitionTo(
        JobApplicationStatus::Shortlisted,
        new DateTimeImmutable('2026-10-29T02:00:00+00:00'),
    );
    $hired = $shortlisted->transitionTo(
        JobApplicationStatus::Hired,
        new DateTimeImmutable('2026-10-29T03:00:00+00:00'),
    );

    expect($application->status)->toBe(JobApplicationStatus::Submitted)
        ->and($reviewed->status)->toBe(JobApplicationStatus::Reviewing)
        ->and($shortlisted->status)->toBe(JobApplicationStatus::Shortlisted)
        ->and($hired->status)->toBe(JobApplicationStatus::Hired);
});

test('terminal applications reject further transitions', function () {
    $rejected = submittedApplication()->transitionTo(
        JobApplicationStatus::Rejected,
        new DateTimeImmutable('2026-10-29T01:00:00+00:00'),
    );

    expect(fn () => $rejected->transitionTo(JobApplicationStatus::Reviewing, new DateTimeImmutable))
        ->toThrow(DomainException::class, 'Application cannot move from rejected to reviewing.');
});

test('candidate can withdraw only before a terminal decision', function () {
    $withdrawn = submittedApplication()->withdraw(new DateTimeImmutable('2026-10-29T01:00:00+00:00'));

    expect($withdrawn->status)->toBe(JobApplicationStatus::Withdrawn)
        ->and($withdrawn->withdrawnAt)->not->toBeNull();

    $rejected = submittedApplication()->transitionTo(
        JobApplicationStatus::Rejected,
        new DateTimeImmutable('2026-10-29T01:00:00+00:00'),
    );

    expect(fn () => $rejected->withdraw(new DateTimeImmutable))
        ->toThrow(DomainException::class, 'Application cannot be withdrawn from rejected status.');
});
