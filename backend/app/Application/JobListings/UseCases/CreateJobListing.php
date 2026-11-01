<?php

namespace App\Application\JobListings\UseCases;

use App\Application\JobListings\DTOs\JobListingData;
use App\Domain\JobListings\Entities\JobListing;
use App\Domain\JobListings\Repositories\JobListingRepository;
use App\Domain\JobListings\ValueObjects\SalaryRange;

final readonly class CreateJobListing
{
    public function __construct(private JobListingRepository $jobListings) {}

    public function execute(int $employerId, JobListingData $data): JobListing
    {
        return $this->jobListings->create(
            employerId: $employerId,
            title: $data->title,
            description: $data->description,
            location: $data->location,
            employmentType: $data->employmentType,
            category: $data->category,
            salary: new SalaryRange($data->salaryMinimum, $data->salaryMaximum),
            currency: 'THB',
        );
    }
}
