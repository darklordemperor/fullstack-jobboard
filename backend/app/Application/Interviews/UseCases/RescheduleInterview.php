<?php

namespace App\Application\Interviews\UseCases;

use App\Application\Interviews\Contracts\InterviewNotifier;
use App\Application\Interviews\DTOs\RescheduleInterviewData;
use App\Application\Interviews\Exceptions\InterviewAccessDenied;
use App\Application\Interviews\Exceptions\InterviewConflict;
use App\Application\Interviews\Exceptions\InterviewNotFound;
use App\Domain\Interviews\Entities\Interview;
use App\Domain\Interviews\Repositories\InterviewRepository;
use DateTimeImmutable;
use DomainException;

final readonly class RescheduleInterview
{
    public function __construct(
        private InterviewRepository $interviews,
        private InterviewNotifier $notifier,
    ) {}

    public function execute(RescheduleInterviewData $data): Interview
    {
        $interview = $this->interviews->findById($data->interviewId) ?? throw new InterviewNotFound;

        if (! $interview->belongsToEmployer($data->employerId)) {
            throw new InterviewAccessDenied;
        }

        if ($data->scheduledAt <= new DateTimeImmutable) {
            throw new DomainException('Interview time must be in the future.');
        }

        if ($data->durationMinutes < 15 || $data->durationMinutes > 480) {
            throw new DomainException('Interview duration must be between 15 and 480 minutes.');
        }

        $endsAt = $data->scheduledAt->modify("+{$data->durationMinutes} minutes");

        if ($this->interviews->hasActiveConflict(
            $interview->employerId,
            $interview->candidateId,
            $data->scheduledAt,
            $endsAt,
            $interview->id,
        )) {
            throw new InterviewConflict;
        }

        $updated = $this->interviews->save($interview->reschedule(
            scheduledAt: $data->scheduledAt,
            durationMinutes: $data->durationMinutes,
            timezone: $data->timezone,
            location: $data->location,
            notes: $data->notes,
            changedAt: new DateTimeImmutable,
        ));
        $this->notifier->notifyCandidateOfSchedule($updated, true);

        return $updated;
    }
}
