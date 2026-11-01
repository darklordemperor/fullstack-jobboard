<?php

namespace App\Application\JobListings\UseCases;

use App\Application\JobListings\DTOs\SearchJobListingsData;
use App\Application\JobListings\DTOs\SearchJobListingsResult;
use App\Domain\JobListings\Repositories\JobListingRepository;
use App\Domain\JobListings\ValueObjects\JobListingSearchCriteria;

final readonly class SearchJobListings
{
    public function __construct(private JobListingRepository $jobListings) {}

    public function execute(SearchJobListingsData $data): SearchJobListingsResult
    {
        $criteria = new JobListingSearchCriteria(
            keyword: $data->keyword,
            location: $data->location,
            employmentTypes: $data->employmentTypes,
            salaryCap: $data->salaryCap,
            category: $data->category,
            sort: $data->sort,
            page: $data->page,
            perPage: $data->perPage,
            savedByUserId: $data->savedByUserId,
        );

        return new SearchJobListingsResult(
            page: $this->jobListings->searchPublished($criteria),
            facets: $this->jobListings->facets(),
        );
    }
}
