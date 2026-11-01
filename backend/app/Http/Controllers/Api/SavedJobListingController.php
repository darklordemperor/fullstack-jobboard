<?php

namespace App\Http\Controllers\Api;

use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Application\JobListings\UseCases\ListSavedJobListingIds;
use App\Application\JobListings\UseCases\RemoveSavedJobListing;
use App\Application\JobListings\UseCases\SaveJobListing;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\JobListings\ManageSavedJobListingsRequest;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SavedJobListingController extends Controller
{
    public function index(
        ManageSavedJobListingsRequest $request,
        ListSavedJobListingIds $listSavedJobListingIds,
    ): JsonResponse {
        $ids = $listSavedJobListingIds->execute((int) $request->user()->getAuthIdentifier());

        return ApiResponse::success([
            'jobListingIds' => $ids,
        ]);
    }

    public function store(
        ManageSavedJobListingsRequest $request,
        int $jobListing,
        SaveJobListing $saveJobListing,
    ): JsonResponse {
        try {
            $ids = $saveJobListing->execute(
                userId: (int) $request->user()->getAuthIdentifier(),
                jobListingId: $jobListing,
            );
        } catch (JobListingNotFound $exception) {
            throw new NotFoundHttpException($exception->getMessage(), $exception);
        }

        return ApiResponse::success(
            ['jobListingIds' => $ids],
            'Job listing saved.',
        );
    }

    public function destroy(
        ManageSavedJobListingsRequest $request,
        int $jobListing,
        RemoveSavedJobListing $removeSavedJobListing,
    ): JsonResponse {
        $ids = $removeSavedJobListing->execute(
            userId: (int) $request->user()->getAuthIdentifier(),
            jobListingId: $jobListing,
        );

        return ApiResponse::success(
            ['jobListingIds' => $ids],
            'Job listing removed from saved jobs.',
        );
    }
}
