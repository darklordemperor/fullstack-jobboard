<?php

namespace App\Http\Controllers\Api;

use App\Application\Interviews\DTOs\ListInterviewsData;
use App\Application\Interviews\DTOs\RescheduleInterviewData;
use App\Application\Interviews\DTOs\ScheduleInterviewData;
use App\Application\Interviews\Exceptions\InterviewAccessDenied;
use App\Application\Interviews\Exceptions\InterviewConflict;
use App\Application\Interviews\Exceptions\InterviewNotFound;
use App\Application\Interviews\UseCases\CancelInterview;
use App\Application\Interviews\UseCases\CompleteInterview;
use App\Application\Interviews\UseCases\ConfirmInterview;
use App\Application\Interviews\UseCases\ListCandidateInterviews;
use App\Application\Interviews\UseCases\ListEmployerInterviews;
use App\Application\Interviews\UseCases\RescheduleInterview;
use App\Application\Interviews\UseCases\ScheduleInterview;
use App\Application\JobApplications\Exceptions\JobApplicationNotFound;
use App\Domain\Interviews\Enums\InterviewStatus;
use App\Domain\Interviews\ValueObjects\InterviewPage;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Interviews\RescheduleInterviewRequest;
use App\Http\Requests\Api\Interviews\SearchCandidateInterviewsRequest;
use App\Http\Requests\Api\Interviews\SearchEmployerInterviewsRequest;
use App\Http\Requests\Api\Interviews\StoreInterviewRequest;
use App\Http\Resources\InterviewResource;
use App\Support\ApiResponse;
use DateTimeImmutable;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class InterviewController extends Controller
{
    public function store(
        StoreInterviewRequest $request,
        int $jobApplication,
        ScheduleInterview $scheduleInterview,
    ): JsonResponse {
        try {
            $interview = $scheduleInterview->execute(new ScheduleInterviewData(
                employerId: (int) $request->user()->getAuthIdentifier(),
                jobApplicationId: $jobApplication,
                scheduledAt: new DateTimeImmutable($request->validated('scheduledAt')),
                durationMinutes: (int) $request->validated('durationMinutes'),
                timezone: $request->validated('timezone'),
                location: $request->validated('location'),
                notes: $request->validated('notes'),
            ));
        } catch (JobApplicationNotFound $exception) {
            throw new NotFoundHttpException($exception->getMessage(), $exception);
        } catch (InterviewAccessDenied $exception) {
            throw new AccessDeniedHttpException($exception->getMessage(), $exception);
        } catch (InterviewConflict|DomainException $exception) {
            return ApiResponse::error($exception->getMessage(), 422, [
                'scheduledAt' => [$exception->getMessage()],
            ]);
        }

        return ApiResponse::success(InterviewResource::make($interview), 'Interview scheduled.', 201);
    }

    public function employerIndex(
        SearchEmployerInterviewsRequest $request,
        ListEmployerInterviews $listInterviews,
    ): JsonResponse {
        return $this->pageResponse($request, $listInterviews->execute($this->listData($request)));
    }

    public function candidateIndex(
        SearchCandidateInterviewsRequest $request,
        ListCandidateInterviews $listInterviews,
    ): JsonResponse {
        return $this->pageResponse($request, $listInterviews->execute($this->listData($request)));
    }

    public function confirm(Request $request, int $interview, ConfirmInterview $confirmInterview): JsonResponse
    {
        if ($request->user()?->role !== 'jobseeker') {
            throw new AccessDeniedHttpException('Only jobseekers can confirm interviews.');
        }

        return $this->transition(
            fn () => $confirmInterview->execute($interview, (int) $request->user()->getAuthIdentifier()),
            'Interview confirmed.',
        );
    }

    public function reschedule(
        RescheduleInterviewRequest $request,
        int $interview,
        RescheduleInterview $rescheduleInterview,
    ): JsonResponse {
        return $this->transition(
            fn () => $rescheduleInterview->execute(new RescheduleInterviewData(
                interviewId: $interview,
                employerId: (int) $request->user()->getAuthIdentifier(),
                scheduledAt: new DateTimeImmutable($request->validated('scheduledAt')),
                durationMinutes: (int) $request->validated('durationMinutes'),
                timezone: $request->validated('timezone'),
                location: $request->validated('location'),
                notes: $request->validated('notes'),
            )),
            'Interview rescheduled.',
        );
    }

    public function cancel(Request $request, int $interview, CancelInterview $cancelInterview): JsonResponse
    {
        $this->guardEmployer($request);

        return $this->transition(
            fn () => $cancelInterview->execute($interview, (int) $request->user()->getAuthIdentifier()),
            'Interview cancelled.',
        );
    }

    public function complete(Request $request, int $interview, CompleteInterview $completeInterview): JsonResponse
    {
        $this->guardEmployer($request);

        return $this->transition(
            fn () => $completeInterview->execute($interview, (int) $request->user()->getAuthIdentifier()),
            'Interview completed.',
        );
    }

    private function listData(Request $request): ListInterviewsData
    {
        return new ListInterviewsData(
            userId: (int) $request->user()->getAuthIdentifier(),
            status: $request->enum('status', InterviewStatus::class),
            page: $request->integer('page', 1),
            perPage: $request->integer('perPage', 10),
        );
    }

    private function pageResponse(Request $request, InterviewPage $page): JsonResponse
    {
        return ApiResponse::success([
            'items' => InterviewResource::collection($page->items)->resolve($request),
            'pagination' => [
                'currentPage' => $page->currentPage,
                'perPage' => $page->perPage,
                'lastPage' => $page->lastPage,
                'total' => $page->total,
            ],
            'counts' => [
                'total' => $page->counts->total,
                'scheduled' => $page->counts->scheduled,
                'confirmed' => $page->counts->confirmed,
                'cancelled' => $page->counts->cancelled,
                'completed' => $page->counts->completed,
            ],
        ]);
    }

    /** @param callable(): mixed $action */
    private function transition(callable $action, string $message): JsonResponse
    {
        try {
            return ApiResponse::success(InterviewResource::make($action()), $message);
        } catch (InterviewNotFound $exception) {
            throw new NotFoundHttpException($exception->getMessage(), $exception);
        } catch (InterviewAccessDenied $exception) {
            throw new AccessDeniedHttpException($exception->getMessage(), $exception);
        } catch (InterviewConflict|DomainException $exception) {
            return ApiResponse::error($exception->getMessage(), 422, [
                'status' => [$exception->getMessage()],
            ]);
        }
    }

    private function guardEmployer(Request $request): void
    {
        if ($request->user()?->role !== 'employer') {
            throw new AccessDeniedHttpException('Only employers can manage interviews.');
        }
    }
}
