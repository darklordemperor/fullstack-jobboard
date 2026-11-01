<?php

namespace Tests\Unit;

use App\Application\JobListings\DTOs\JobListingData;
use App\Application\JobListings\DTOs\ListEmployerJobListingsData;
use App\Application\JobListings\Exceptions\JobListingAccessDenied;
use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Application\JobListings\UseCases\CreateJobListing;
use App\Application\JobListings\UseCases\ListEmployerJobListings;
use App\Application\JobListings\UseCases\ListSavedJobListingIds;
use App\Application\JobListings\UseCases\PublishJobListing;
use App\Application\JobListings\UseCases\RemoveSavedJobListing;
use App\Application\JobListings\UseCases\SaveJobListing;
use App\Domain\JobListings\Enums\EmploymentType;
use App\Domain\JobListings\Enums\JobListingStatus;
use Tests\Fakes\FakeJobListingRepository;
use Tests\Fakes\FakeSavedJobListingRepository;

function jobListingData(): JobListingData
{
    return new JobListingData(
        title: 'Backend Engineer',
        description: str_repeat('Build reliable services. ', 3),
        location: 'Remote',
        employmentType: EmploymentType::Remote,
        category: 'IT',
        salaryMinimum: 80000,
        salaryMaximum: 140000,
    );
}

test('create job listing produces a draft with a validated salary range', function () {
    $repository = new FakeJobListingRepository;

    $jobListing = (new CreateJobListing($repository))->execute(7, jobListingData());

    expect($jobListing->employerId)->toBe(7)
        ->and($jobListing->status)->toBe(JobListingStatus::Draft)
        ->and($jobListing->salary->minimum)->toBe(80000)
        ->and($jobListing->salary->maximum)->toBe(140000);
});

test('publish job listing changes the aggregate state', function () {
    $repository = new FakeJobListingRepository;
    $draft = (new CreateJobListing($repository))->execute(7, jobListingData());

    $published = (new PublishJobListing($repository))->execute($draft->id, 7);

    expect($published->status)->toBe(JobListingStatus::Published)
        ->and($published->publishedAt)->not->toBeNull();
});

test('publish job listing rejects a different employer', function () {
    $repository = new FakeJobListingRepository;
    $draft = (new CreateJobListing($repository))->execute(7, jobListingData());

    expect(fn () => (new PublishJobListing($repository))->execute($draft->id, 99))
        ->toThrow(JobListingAccessDenied::class);
});

test('list employer job listings scopes results and returns lifecycle counts', function () {
    $repository = new FakeJobListingRepository;
    $owned = (new CreateJobListing($repository))->execute(7, jobListingData());
    (new CreateJobListing($repository))->execute(99, jobListingData());
    (new PublishJobListing($repository))->execute($owned->id, 7);

    $result = (new ListEmployerJobListings($repository))->execute(new ListEmployerJobListingsData(
        employerId: 7,
        status: JobListingStatus::Published,
        page: 1,
        perPage: 10,
    ));

    expect($result->page->items)->toHaveCount(1)
        ->and($result->page->items[0]->employerId)->toBe(7)
        ->and($result->counts->total)->toBe(1)
        ->and($result->counts->published)->toBe(1);

    $filtered = (new ListEmployerJobListings($repository))->execute(new ListEmployerJobListingsData(
        employerId: 7,
        status: null,
        page: 1,
        perPage: 10,
        search: 'Backend',
    ));

    expect($filtered->page->items)->toHaveCount(1)
        ->and($filtered->page->items[0]->title)->toBe('Backend Engineer');
});

test('jobseeker can save list and remove published job listings', function () {
    $jobListings = new FakeJobListingRepository;
    $savedJobListings = new FakeSavedJobListingRepository;

    $draft = (new CreateJobListing($jobListings))->execute(7, jobListingData());
    $published = (new PublishJobListing($jobListings))->execute($draft->id, 7);

    $idsAfterSave = (new SaveJobListing($jobListings, $savedJobListings))->execute(42, $published->id);
    $listedIds = (new ListSavedJobListingIds($savedJobListings))->execute(42);
    $idsAfterRemove = (new RemoveSavedJobListing($savedJobListings))->execute(42, $published->id);

    expect($idsAfterSave)->toBe([$published->id])
        ->and($listedIds)->toBe([$published->id])
        ->and($idsAfterRemove)->toBe([]);
});

test('save job listing rejects non-published or missing job listings', function () {
    $jobListings = new FakeJobListingRepository;
    $savedJobListings = new FakeSavedJobListingRepository;
    $draft = (new CreateJobListing($jobListings))->execute(7, jobListingData());

    expect(fn () => (new SaveJobListing($jobListings, $savedJobListings))->execute(42, $draft->id))
        ->toThrow(JobListingNotFound::class);

    expect(fn () => (new SaveJobListing($jobListings, $savedJobListings))->execute(42, 999))
        ->toThrow(JobListingNotFound::class);
});
