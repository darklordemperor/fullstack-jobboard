<?php

namespace App\Domain\JobListings\Repositories;

use App\Domain\JobListings\Entities\JobListing;
use App\Domain\JobListings\Enums\EmploymentType;
use App\Domain\JobListings\Enums\JobListingStatus;
use App\Domain\JobListings\ValueObjects\JobListingFacets;
use App\Domain\JobListings\ValueObjects\JobListingPage;
use App\Domain\JobListings\ValueObjects\JobListingSearchCriteria;
use App\Domain\JobListings\ValueObjects\JobListingStatusCounts;
use App\Domain\JobListings\ValueObjects\SalaryRange;

interface JobListingRepository
{
    public function searchPublished(JobListingSearchCriteria $criteria): JobListingPage;

    public function searchByEmployer(
        int $employerId,
        ?JobListingStatus $status,
        int $page,
        int $perPage,
        ?string $search = null,
    ): JobListingPage;

    public function statusCountsByEmployer(int $employerId): JobListingStatusCounts;

    public function facets(): JobListingFacets;

    public function findById(int $id): ?JobListing;

    public function findPublishedById(int $id): ?JobListing;

    public function create(
        int $employerId,
        string $title,
        string $description,
        string $location,
        EmploymentType $employmentType,
        string $category,
        SalaryRange $salary,
        string $currency,
    ): JobListing;

    public function save(JobListing $jobListing): JobListing;
}
