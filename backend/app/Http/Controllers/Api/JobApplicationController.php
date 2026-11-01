<?php

namespace App\Http\Controllers\Api;

use App\Application\JobApplications\DTOs\ListEmployerJobApplicationsData;
use App\Application\JobApplications\DTOs\ListJobseekerApplicationsData;
use App\Application\JobApplications\DTOs\ResumeUploadData;
use App\Application\JobApplications\DTOs\SubmitJobApplicationData;
use App\Application\JobApplications\Exceptions\JobApplicationAccessDenied;
use App\Application\JobApplications\Exceptions\JobApplicationNotFound;
use App\Application\JobApplications\Exceptions\JobApplicationResumeNotFound;
use App\Application\JobApplications\UseCases\GetJobApplicationResume;
use App\Application\JobApplications\UseCases\ListEmployerJobApplications;
use App\Application\JobApplications\UseCases\ListJobseekerApplications;
use App\Application\JobApplications\UseCases\SubmitJobApplication;
use App\Application\JobApplications\UseCases\UpdateJobApplicationStatus;
use App\Application\JobApplications\UseCases\WithdrawJobApplication;
use App\Application\JobListings\Exceptions\JobListingAccessDenied;
use App\Application\JobListings\Exceptions\JobListingNotFound;
use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\JobApplications\SearchEmployerJobApplicationsRequest;
use App\Http\Requests\Api\JobApplications\SearchJobseekerApplicationsRequest;
use App\Http\Requests\Api\JobApplications\StoreJobApplicationRequest;
use App\Http\Requests\Api\JobApplications\UpdateJobApplicationStatusRequest;
use App\Http\Resources\JobApplicationResource;
use App\Support\ApiResponse;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use RuntimeException;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class JobApplicationController extends Controller
{
    public function store(
        StoreJobApplicationRequest $request,
        int $jobListing,
        SubmitJobApplication $submitJobApplication,
    ): JsonResponse {
        try {
            $application = $submitJobApplication->execute(new SubmitJobApplicationData(
                jobListingId: $jobListing,
                applicantId: (int) $request->user()->getAuthIdentifier(),
                coverLetter: $request->validated('coverLetter'),
                resume: $this->resumeUpload($request->file('resume')),
            ));
        } catch (JobListingNotFound $exception) {
            throw new NotFoundHttpException($exception->getMessage(), $exception);
        } catch (DomainException $exception) {
            return ApiResponse::error($exception->getMessage(), 422, [
                'jobListing' => [$exception->getMessage()],
            ]);
        }

        return ApiResponse::success(
            JobApplicationResource::make($application),
            'Application submitted.',
            201,
        );
    }

    public function index(
        SearchEmployerJobApplicationsRequest $request,
        int $jobListing,
        ListEmployerJobApplications $listEmployerJobApplications,
    ): JsonResponse {
        try {
            $result = $listEmployerJobApplications->execute(new ListEmployerJobApplicationsData(
                employerId: (int) $request->user()->getAuthIdentifier(),
                jobListingId: $jobListing,
                status: $request->enum('status', JobApplicationStatus::class),
                page: $request->integer('page', 1),
                perPage: $request->integer('perPage', 10),
                search: $request->validated('search'),
            ));
        } catch (JobListingNotFound $exception) {
            throw new NotFoundHttpException($exception->getMessage(), $exception);
        } catch (JobListingAccessDenied $exception) {
            throw new AccessDeniedHttpException($exception->getMessage(), $exception);
        }

        return ApiResponse::success([
            'items' => JobApplicationResource::collection($result->page->items)->resolve($request),
            'pagination' => [
                'currentPage' => $result->page->currentPage,
                'perPage' => $result->page->perPage,
                'lastPage' => $result->page->lastPage,
                'total' => $result->page->total,
            ],
            'counts' => [
                'total' => $result->counts->total,
                'submitted' => $result->counts->submitted,
                'reviewing' => $result->counts->reviewing,
                'shortlisted' => $result->counts->shortlisted,
                'rejected' => $result->counts->rejected,
                'hired' => $result->counts->hired,
                'withdrawn' => $result->counts->withdrawn,
            ],
        ]);
    }

    public function jobseekerIndex(
        SearchJobseekerApplicationsRequest $request,
        ListJobseekerApplications $listJobseekerApplications,
    ): JsonResponse {
        $result = $listJobseekerApplications->execute(new ListJobseekerApplicationsData(
            applicantId: (int) $request->user()->getAuthIdentifier(),
            status: $request->enum('status', JobApplicationStatus::class),
            page: $request->integer('page', 1),
            perPage: $request->integer('perPage', 10),
            jobListingId: $request->integer('jobListingId') ?: null,
            search: $request->validated('search'),
        ));

        return ApiResponse::success([
            'items' => JobApplicationResource::collection($result->page->items)->resolve($request),
            'pagination' => [
                'currentPage' => $result->page->currentPage,
                'perPage' => $result->page->perPage,
                'lastPage' => $result->page->lastPage,
                'total' => $result->page->total,
            ],
            'counts' => [
                'total' => $result->counts->total,
                'submitted' => $result->counts->submitted,
                'reviewing' => $result->counts->reviewing,
                'shortlisted' => $result->counts->shortlisted,
                'rejected' => $result->counts->rejected,
                'hired' => $result->counts->hired,
                'withdrawn' => $result->counts->withdrawn,
            ],
        ]);
    }

    public function updateStatus(
        UpdateJobApplicationStatusRequest $request,
        int $jobApplication,
        UpdateJobApplicationStatus $updateJobApplicationStatus,
    ): JsonResponse {
        try {
            $application = $updateJobApplicationStatus->execute(
                applicationId: $jobApplication,
                employerId: (int) $request->user()->getAuthIdentifier(),
                status: $request->enum('status', JobApplicationStatus::class),
            );
        } catch (JobApplicationNotFound $exception) {
            throw new NotFoundHttpException($exception->getMessage(), $exception);
        } catch (JobApplicationAccessDenied $exception) {
            throw new AccessDeniedHttpException($exception->getMessage(), $exception);
        } catch (DomainException $exception) {
            return ApiResponse::error($exception->getMessage(), 422, [
                'status' => [$exception->getMessage()],
            ]);
        }

        return ApiResponse::success(
            JobApplicationResource::make($application),
            'Application status updated.',
        );
    }

    public function withdraw(
        Request $request,
        int $jobApplication,
        WithdrawJobApplication $withdrawJobApplication,
    ): JsonResponse {
        if ($request->user()?->role !== 'jobseeker') {
            throw new AccessDeniedHttpException('Only jobseekers can withdraw applications.');
        }

        try {
            $application = $withdrawJobApplication->execute(
                applicationId: $jobApplication,
                applicantId: (int) $request->user()->getAuthIdentifier(),
            );
        } catch (JobApplicationNotFound $exception) {
            throw new NotFoundHttpException($exception->getMessage(), $exception);
        } catch (JobApplicationAccessDenied $exception) {
            throw new AccessDeniedHttpException($exception->getMessage(), $exception);
        } catch (DomainException $exception) {
            return ApiResponse::error($exception->getMessage(), 422, [
                'status' => [$exception->getMessage()],
            ]);
        }

        return ApiResponse::success(
            JobApplicationResource::make($application),
            'Application withdrawn.',
        );
    }

    public function resume(
        Request $request,
        int $jobApplication,
        GetJobApplicationResume $getJobApplicationResume,
    ): Response {
        try {
            $resume = $getJobApplicationResume->execute(
                applicationId: $jobApplication,
                requesterId: (int) $request->user()->getAuthIdentifier(),
                requesterRole: (string) $request->user()->role,
            );
        } catch (JobApplicationNotFound|JobApplicationResumeNotFound $exception) {
            throw new NotFoundHttpException($exception->getMessage(), $exception);
        } catch (JobApplicationAccessDenied $exception) {
            throw new AccessDeniedHttpException($exception->getMessage(), $exception);
        }

        return response($resume->contents, 200, [
            'Content-Type' => $resume->mimeType,
            'Content-Length' => (string) $resume->size,
            'Content-Disposition' => HeaderUtils::makeDisposition(
                HeaderUtils::DISPOSITION_ATTACHMENT,
                $resume->originalName,
                'resume.pdf',
            ),
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function resumeUpload(?UploadedFile $file): ?ResumeUploadData
    {
        if ($file === null) {
            return null;
        }

        $contents = file_get_contents($file->getPathname());

        if ($contents === false) {
            throw new RuntimeException('Uploaded resume could not be read.');
        }

        return new ResumeUploadData(
            originalName: $file->getClientOriginalName(),
            mimeType: $file->getMimeType() ?? 'application/pdf',
            size: (int) $file->getSize(),
            contents: $contents,
        );
    }
}
