<?php

namespace App\Application\Interviews\Contracts;

use App\Domain\Interviews\Entities\Interview;

interface InterviewNotifier
{
    public function notifyCandidateOfSchedule(Interview $interview, bool $rescheduled = false): void;

    public function notifyEmployerOfConfirmation(Interview $interview): void;

    public function notifyCandidateOfCancellation(Interview $interview): void;

    public function notifyCandidateOfCompletion(Interview $interview): void;
}
