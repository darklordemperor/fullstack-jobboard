<?php

namespace App\Application\Interviews\UseCases;

use App\Application\Interviews\Contracts\InterviewNotifier;
use App\Application\Interviews\DTOs\ScheduleInterviewData;
use App\Application\Interviews\Exceptions\InterviewAccessDenied;
use App\Application\Interviews\Exceptions\InterviewConflict;
use App\Application\JobApplications\Exceptions\JobApplicationNotFound;
use App\Domain\Interviews\Entities\Interview;
use App\Domain\Interviews\Repositories\InterviewRepository;
use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Domain\JobApplications\Repositories\JobApplicationRepository;
use DateTimeImmutable;
use DomainException;

final readonly class ScheduleInterview
{
    public function __construct(
        private JobApplicationRepository $applications,
        private InterviewRepository $interviews,
        private InterviewNotifier $notifier,
    ) {}

    public function execute(ScheduleInterviewData $data): Interview
    {
        $application = $this->applications->findById($data->jobApplicationId)
            ?? throw new JobApplicationNotFound;

        if (! $application->belongsToEmployer($data->employerId)) {
            throw new InterviewAccessDenied;
        }

        if ($application->status !== JobApplicationStatus::Shortlisted) {
            throw new DomainException('Only shortlisted applications can be scheduled for an interview.');
        }

        $this->guardSchedule($data->scheduledAt, $data->durationMinutes);
        $endsAt = $data->scheduledAt->modify("+{$data->durationMinutes} minutes");

        if ($this->interviews->hasActiveConflict(
            $data->employerId,
            $application->applicantId,
            $data->scheduledAt,
            $endsAt,
        )) {
            throw new InterviewConflict;
        }

        $interview = $this->interviews->create(
            jobApplicationId: $application->id,
            employerId: $data->employerId,
            candidateId: $application->applicantId,
            scheduledAt: $data->scheduledAt,
            durationMinutes: $data->durationMinutes,
            timezone: $data->timezone,
            location: $data->location,
            notes: $data->notes,
        );

        $this->notifier->notifyCandidateOfSchedule($interview);

        return $interview;
    }

    private function guardSchedule(DateTimeImmutable $scheduledAt, int $durationMinutes): void
    {
        if ($scheduledAt <= new DateTimeImmutable) {
            throw new DomainException('Interview time must be in the future.');
        }

        if ($durationMinutes < 15 || $durationMinutes > 480) {
            throw new DomainException('Interview duration must be between 15 and 480 minutes.');
        }
    }
}
