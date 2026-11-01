<?php

namespace App\Http\Controllers\Api;

use App\Application\JobListings\DTOs\SearchJobListingsData;
use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Application\JobListings\UseCases\GetPublishedJobListing;
use App\Application\JobListings\UseCases\SearchJobListings;
use App\Domain\JobListings\Enums\EmploymentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\JobListings\SearchJobListingsRequest;
use App\Http\Resources\JobListingResource;
use App\Http\Resources\JobListingSummaryResource;
use App\Support\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class JobListingController extends Controller
{
    public function index(SearchJobListingsRequest $request, SearchJobListings $searchJobListings): JsonResponse
    {
        $employmentTypes = array_map(
            fn (string $type): EmploymentType => EmploymentType::from($type),
            $request->validated('employmentTypes', []),
        );

        $savedByUserId = null;
        if ($request->boolean('savedOnly')) {
            $user = $request->user() ?? $request->user('sanctum');
            if ($user === null) {
                throw new AuthenticationException('Unauthenticated.');
            }
            if ($user->role !== 'jobseeker') {
                throw new AccessDeniedHttpException('Only jobseekers can filter by saved jobs.');
            }
            $savedByUserId = (int) $user->getAuthIdentifier();
        }

        $result = $searchJobListings->execute(new SearchJobListingsData(
            keyword: $request->validated('keyword'),
            location: $request->validated('location'),
            employmentTypes: $employmentTypes,
            salaryCap: $request->integer('salaryCap') ?: null,
            category: $request->validated('category'),
            sort: $request->validated('sort', 'newest'),
            page: $request->integer('page', 1),
            perPage: $request->integer('perPage', 12),
            savedByUserId: $savedByUserId,
        ));

        return ApiResponse::success([
            'items' => JobListingSummaryResource::collection($result->page->items)->resolve($request),
            'pagination' => [
                'currentPage' => $result->page->currentPage,
                'perPage' => $result->page->perPage,
                'lastPage' => $result->page->lastPage,
                'total' => $result->page->total,
            ],
            'facets' => [
                'locations' => $result->facets->locations,
                'employmentTypes' => array_map(fn (EmploymentType $type): string => $type->value, $result->facets->employmentTypes),
                'categories' => $result->facets->categories,
            ],
        ]);
    }

    public function show(int $jobListing, GetPublishedJobListing $getPublishedJobListing): JsonResponse
    {
        try {
            $listing = $getPublishedJobListing->execute($jobListing);
        } catch (JobListingNotFound $exception) {
            throw new NotFoundHttpException($exception->getMessage(), $exception);
        }

        return ApiResponse::success(JobListingResource::make($listing));
    }
}
