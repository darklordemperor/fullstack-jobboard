<?php

namespace Tests\Fakes;

use App\Domain\JobListings\Entities\JobListing;
use App\Domain\JobListings\Enums\EmploymentType;
use App\Domain\JobListings\Enums\JobListingStatus;
use App\Domain\JobListings\Repositories\JobListingRepository;
use App\Domain\JobListings\ValueObjects\JobListingFacets;
use App\Domain\JobListings\ValueObjects\JobListingPage;
use App\Domain\JobListings\ValueObjects\JobListingSearchCriteria;
use App\Domain\JobListings\ValueObjects\JobListingStatusCounts;
use App\Domain\JobListings\ValueObjects\SalaryRange;
use DateTimeImmutable;

final class FakeJobListingRepository implements JobListingRepository
{
    /** @var array<int, JobListing> */
    public array $items = [];

    public function searchPublished(JobListingSearchCriteria $criteria): JobListingPage
    {
        return new JobListingPage([], 1, $criteria->perPage, 1, 0);
    }

    public function searchByEmployer(
        int $employerId,
        ?JobListingStatus $status,
        int $page,
        int $perPage,
        ?string $search = null,
    ): JobListingPage {
        $needle = $search !== null ? strtolower(trim($search)) : '';
        $items = array_values(array_filter(
            $this->items,
            fn (JobListing $jobListing): bool => $jobListing->employerId === $employerId
                && ($status === null || $jobListing->status === $status)
                && ($needle === ''
                    || str_contains(strtolower($jobListing->title), $needle)
                    || str_contains(strtolower($jobListing->location), $needle)
                    || str_contains(strtolower($jobListing->category), $needle)),
        ));

        return new JobListingPage($items, $page, $perPage, 1, count($items));
    }

    public function statusCountsByEmployer(int $employerId): JobListingStatusCounts
    {
        $items = array_filter(
            $this->items,
            fn (JobListing $jobListing): bool => $jobListing->employerId === $employerId,
        );

        return new JobListingStatusCounts(
            total: count($items),
            draft: count(array_filter($items, fn (JobListing $jobListing): bool => $jobListing->status === JobListingStatus::Draft)),
            published: count(array_filter($items, fn (JobListing $jobListing): bool => $jobListing->status === JobListingStatus::Published)),
            closed: count(array_filter($items, fn (JobListing $jobListing): bool => $jobListing->status === JobListingStatus::Closed)),
        );
    }

    public function facets(): JobListingFacets
    {
        return new JobListingFacets([], EmploymentType::cases(), []);
    }

    public function findById(int $id): ?JobListing
    {
        return $this->items[$id] ?? null;
    }

    public function findPublishedById(int $id): ?JobListing
    {
        $jobListing = $this->findById($id);

        return $jobListing?->status === JobListingStatus::Published ? $jobListing : null;
    }

    public function create(
        int $employerId,
        string $title,
        string $description,
        string $location,
        EmploymentType $employmentType,
        string $category,
        SalaryRange $salary,
        string $currency,
    ): JobListing {
        $now = new DateTimeImmutable;
        $jobListing = new JobListing(
            id: count($this->items) + 1,
            employerId: $employerId,
            employerName: 'Employer',
            title: $title,
            description: $description,
            location: $location,
            employmentType: $employmentType,
            category: $category,
            salary: $salary,
            currency: $currency,
            status: JobListingStatus::Draft,
            publishedAt: null,
            createdAt: $now,
            updatedAt: $now,
        );
        $this->items[$jobListing->id] = $jobListing;

        return $jobListing;
    }

    public function save(JobListing $jobListing): JobListing
    {
        $this->items[$jobListing->id] = $jobListing;

        return $jobListing;
    }
}
