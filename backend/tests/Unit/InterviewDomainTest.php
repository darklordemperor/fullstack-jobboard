<?php

use App\Domain\Interviews\Entities\Interview;
use App\Domain\Interviews\Enums\InterviewStatus;

function scheduledInterview(): Interview
{
    $createdAt = new DateTimeImmutable('2026-10-29T00:00:00+00:00');

    return new Interview(
        id: 12,
        jobApplicationId: 8,
        jobListingId: 4,
        jobTitle: 'Backend Engineer',
        employerId: 2,
        employerName: 'Acme',
        candidateId: 9,
        candidateName: 'Jane Candidate',
        candidateEmail: 'jane@example.com',
        scheduledAt: new DateTimeImmutable('2026-11-02T03:00:00+00:00'),
        durationMinutes: 60,
        timezone: 'Asia/Bangkok',
        location: 'https://meet.example/interview',
        notes: 'Bring a portfolio.',
        status: InterviewStatus::Scheduled,
        confirmedAt: null,
        cancelledAt: null,
        completedAt: null,
        createdAt: $createdAt,
        updatedAt: $createdAt,
    );
}

test('candidate confirmation preserves interview details', function () {
    $confirmedAt = new DateTimeImmutable('2026-10-30T00:00:00+00:00');
    $confirmed = scheduledInterview()->confirm($confirmedAt);

    expect($confirmed->status)->toBe(InterviewStatus::Confirmed)
        ->and($confirmed->confirmedAt)->toEqual($confirmedAt)
        ->and($confirmed->notes)->toBe('Bring a portfolio.')
        ->and($confirmed->endsAt()->format(DATE_ATOM))->toBe('2026-11-02T04:00:00+00:00');
});

test('rescheduling returns interview to candidate confirmation', function () {
    $confirmed = scheduledInterview()->confirm(new DateTimeImmutable('2026-10-30T00:00:00+00:00'));
    $rescheduled = $confirmed->reschedule(
        scheduledAt: new DateTimeImmutable('2026-11-03T04:00:00+00:00'),
        durationMinutes: 45,
        timezone: 'UTC',
        location: 'Conference room 2',
        notes: null,
        changedAt: new DateTimeImmutable('2026-10-31T00:00:00+00:00'),
    );

    expect($rescheduled->status)->toBe(InterviewStatus::Scheduled)
        ->and($rescheduled->confirmedAt)->toBeNull()
        ->and($rescheduled->durationMinutes)->toBe(45)
        ->and($rescheduled->notes)->toBeNull();
});

test('completion requires confirmation and the scheduled end time', function () {
    expect(fn () => scheduledInterview()->complete(new DateTimeImmutable('2026-11-02T05:00:00+00:00')))
        ->toThrow(DomainException::class, 'Only a confirmed interview can be completed.');

    $confirmed = scheduledInterview()->confirm(new DateTimeImmutable('2026-10-30T00:00:00+00:00'));

    expect(fn () => $confirmed->complete(new DateTimeImmutable('2026-11-02T03:30:00+00:00')))
        ->toThrow(DomainException::class, 'An interview cannot be completed before its scheduled end time.')
        ->and($confirmed->complete(new DateTimeImmutable('2026-11-02T04:00:00+00:00'))->status)
        ->toBe(InterviewStatus::Completed);
});

test('terminal interviews cannot be changed again', function () {
    $cancelled = scheduledInterview()->cancel(new DateTimeImmutable('2026-10-30T00:00:00+00:00'));

    expect(fn () => $cancelled->confirm(new DateTimeImmutable))
        ->toThrow(DomainException::class, 'Only a scheduled interview can be confirmed.')
        ->and(fn () => $cancelled->cancel(new DateTimeImmutable))
        ->toThrow(DomainException::class, 'Only an active interview can be cancelled.');
});
