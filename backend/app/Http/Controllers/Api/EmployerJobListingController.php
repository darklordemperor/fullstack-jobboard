<?php

namespace App\Http\Controllers\Api;

use App\Application\JobListings\DTOs\JobListingData;
use App\Application\JobListings\DTOs\ListEmployerJobListingsData;
use App\Application\JobListings\Exceptions\JobListingAccessDenied;
use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Application\JobListings\UseCases\CloseJobListing;
use App\Application\JobListings\UseCases\CreateJobListing;
use App\Application\JobListings\UseCases\GetEmployerJobListing;
use App\Application\JobListings\UseCases\ListEmployerJobListings;
use App\Application\JobListings\UseCases\PublishJobListing;
use App\Application\JobListings\UseCases\UpdateJobListing;
use App\Domain\JobListings\Entities\JobListing;
use App\Domain\JobListings\Enums\EmploymentType;
use App\Domain\JobListings\Enums\JobListingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\JobListings\SearchEmployerJobListingsRequest;
use App\Http\Requests\Api\JobListings\StoreJobListingRequest;
use App\Http\Requests\Api\JobListings\UpdateJobListingRequest;
use App\Http\Resources\EmployerJobListingSummaryResource;
use App\Http\Resources\JobListingResource;
use App\Support\ApiResponse;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class EmployerJobListingController extends Controller
{
    public function index(
        SearchEmployerJobListingsRequest $request,
        ListEmployerJobListings $listEmployerJobListings,
    ): JsonResponse {
        $result = $listEmployerJobListings->execute(new ListEmployerJobListingsData(
            employerId: (int) $request->user()->getAuthIdentifier(),
            status: $request->enum('status', JobListingStatus::class),
            page: $request->integer('page', 1),
            perPage: $request->integer('perPage', 10),
            search: $request->validated('search'),
        ));

        return ApiResponse::success([
            'items' => EmployerJobListingSummaryResource::collection($result->page->items)->resolve($request),
            'pagination' => [
                'currentPage' => $result->page->currentPage,
                'perPage' => $result->page->perPage,
                'lastPage' => $result->page->lastPage,
                'total' => $result->page->total,
            ],
            'counts' => [
                'total' => $result->counts->total,
                'draft' => $result->counts->draft,
                'published' => $result->counts->published,
                'closed' => $result->counts->closed,
            ],
        ]);
    }

    public function show(Request $request, int $jobListing, GetEmployerJobListing $getEmployerJobListing): JsonResponse
    {
        $this->ensureEmployer($request);

        return $this->managedResponse(
            fn (): JobListing => $getEmployerJobListing->execute(
                $jobListing,
                (int) $request->user()->getAuthIdentifier(),
            ),
            'Job listing retrieved.',
        );
    }

    public function store(StoreJobListingRequest $request, CreateJobListing $createJobListing): JsonResponse
    {
        $jobListing = $createJobListing->execute(
            employerId: (int) $request->user()->getAuthIdentifier(),
            data: $this->dataFrom($request),
        );

        return ApiResponse::success(JobListingResource::make($jobListing), 'Job listing created.', 201);
    }

    public function update(
        UpdateJobListingRequest $request,
        int $jobListing,
        UpdateJobListing $updateJobListing,
    ): JsonResponse {
        return $this->managedResponse(fn (): JobListing => $updateJobListing->execute(
            id: $jobListing,
            employerId: (int) $request->user()->getAuthIdentifier(),
            data: $this->dataFrom($request),
        ), 'Job listing updated.');
    }

    public function publish(Request $request, int $jobListing, PublishJobListing $publishJobListing): JsonResponse
    {
        $this->ensureEmployer($request);

        return $this->managedResponse(
            fn (): JobListing => $publishJobListing->execute($jobListing, (int) $request->user()->getAuthIdentifier()),
            'Job listing published.',
        );
    }

    public function close(Request $request, int $jobListing, CloseJobListing $closeJobListing): JsonResponse
    {
        $this->ensureEmployer($request);

        return $this->managedResponse(
            fn (): JobListing => $closeJobListing->execute($jobListing, (int) $request->user()->getAuthIdentifier()),
            'Job listing closed.',
        );
    }

    private function dataFrom(StoreJobListingRequest|UpdateJobListingRequest $request): JobListingData
    {
        return new JobListingData(
            title: $request->validated('title'),
            description: $request->validated('description'),
            location: $request->validated('location'),
            employmentType: EmploymentType::from($request->validated('employmentType')),
            category: $request->validated('category'),
            salaryMinimum: $request->integer('salaryMinimum'),
            salaryMaximum: $request->integer('salaryMaximum'),
        );
    }

    /**
     * @param  callable(): JobListing  $action
     */
    private function managedResponse(callable $action, string $message): JsonResponse
    {
        try {
            $jobListing = $action();
        } catch (JobListingNotFound $exception) {
            throw new NotFoundHttpException($exception->getMessage(), $exception);
        } catch (JobListingAccessDenied $exception) {
            throw new AccessDeniedHttpException($exception->getMessage(), $exception);
        } catch (DomainException $exception) {
            return ApiResponse::error($exception->getMessage(), 422, [
                'status' => [$exception->getMessage()],
            ]);
        }

        return ApiResponse::success(JobListingResource::make($jobListing), $message);
    }

    private function ensureEmployer(Request $request): void
    {
        if ($request->user()?->role !== 'employer') {
            throw new AccessDeniedHttpException('Only employers can manage job listings.');
        }
    }
}
