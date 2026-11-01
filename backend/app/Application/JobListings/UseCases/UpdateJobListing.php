<?php

namespace App\Application\JobListings\UseCases;

use App\Application\JobListings\DTOs\JobListingData;
use App\Application\JobListings\Exceptions\JobListingAccessDenied;
use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Domain\JobListings\Entities\JobListing;
use App\Domain\JobListings\Repositories\JobListingRepository;
use App\Domain\JobListings\ValueObjects\SalaryRange;
use DateTimeImmutable;

final readonly class UpdateJobListing
{
    public function __construct(private JobListingRepository $jobListings) {}

    public function execute(int $id, int $employerId, JobListingData $data): JobListing
    {
        $jobListing = $this->ownedJobListing($id, $employerId);

        return $this->jobListings->save($jobListing->updateDetails(
            title: $data->title,
            description: $data->description,
            location: $data->location,
            employmentType: $data->employmentType,
            category: $data->category,
            salary: new SalaryRange($data->salaryMinimum, $data->salaryMaximum),
            updatedAt: new DateTimeImmutable,
        ));
    }

    private function ownedJobListing(int $id, int $employerId): JobListing
    {
        $jobListing = $this->jobListings->findById($id) ?? throw new JobListingNotFound;

        if (! $jobListing->belongsTo($employerId)) {
            throw new JobListingAccessDenied;
        }

        return $jobListing;
    }
}
