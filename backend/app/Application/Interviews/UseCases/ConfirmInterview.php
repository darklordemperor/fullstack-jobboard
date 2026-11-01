<?php

namespace App\Application\Interviews\UseCases;

use App\Application\Interviews\Contracts\InterviewNotifier;
use App\Application\Interviews\Exceptions\InterviewAccessDenied;
use App\Application\Interviews\Exceptions\InterviewNotFound;
use App\Domain\Interviews\Entities\Interview;
use App\Domain\Interviews\Repositories\InterviewRepository;
use DateTimeImmutable;

final readonly class ConfirmInterview
{
    public function __construct(
        private InterviewRepository $interviews,
        private InterviewNotifier $notifier,
    ) {}

    public function execute(int $interviewId, int $candidateId): Interview
    {
        $interview = $this->interviews->findById($interviewId) ?? throw new InterviewNotFound;

        if (! $interview->belongsToCandidate($candidateId)) {
            throw new InterviewAccessDenied;
        }

        $updated = $this->interviews->save($interview->confirm(new DateTimeImmutable));
        $this->notifier->notifyEmployerOfConfirmation($updated);

        return $updated;
    }
}
