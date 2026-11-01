<?php

namespace App\Infrastructure\Notifications;

use App\Application\Interviews\Contracts\InterviewNotifier;
use App\Domain\Interviews\Entities\Interview;
use App\Models\User;
use App\Notifications\InterviewScheduledNotification;
use App\Notifications\InterviewStatusChangedNotification;

final class LaravelInterviewNotifier implements InterviewNotifier
{
    public function notifyCandidateOfSchedule(Interview $interview, bool $rescheduled = false): void
    {
        User::query()->find($interview->candidateId)?->notify(new InterviewScheduledNotification(
            jobTitle: $interview->jobTitle,
            scheduledAt: $interview->scheduledAt,
            timezone: $interview->timezone,
            location: $interview->location,
            rescheduled: $rescheduled,
        ));
    }

    public function notifyEmployerOfConfirmation(Interview $interview): void
    {
        User::query()->find($interview->employerId)?->notify(new InterviewStatusChangedNotification(
            jobTitle: $interview->jobTitle,
            participantName: $interview->candidateName,
            status: 'confirmed',
        ));
    }

    public function notifyCandidateOfCancellation(Interview $interview): void
    {
        $this->notifyCandidateOfStatus($interview, 'cancelled');
    }

    public function notifyCandidateOfCompletion(Interview $interview): void
    {
        $this->notifyCandidateOfStatus($interview, 'completed');
    }

    private function notifyCandidateOfStatus(Interview $interview, string $status): void
    {
        User::query()->find($interview->candidateId)?->notify(new InterviewStatusChangedNotification(
            jobTitle: $interview->jobTitle,
            participantName: $interview->employerName,
            status: $status,
        ));
    }
}
