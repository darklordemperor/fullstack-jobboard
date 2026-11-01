<?php

namespace App\Application\Interviews\UseCases;

use App\Application\Interviews\Contracts\InterviewNotifier;
use App\Application\Interviews\Exceptions\InterviewAccessDenied;
use App\Application\Interviews\Exceptions\InterviewNotFound;
use App\Domain\Interviews\Entities\Interview;
use App\Domain\Interviews\Repositories\InterviewRepository;
use DateTimeImmutable;

final readonly class CancelInterview
{
    public function __construct(
        private InterviewRepository $interviews,
        private InterviewNotifier $notifier,
    ) {}

    public function execute(int $interviewId, int $employerId): Interview
    {
        $interview = $this->interviews->findById($interviewId) ?? throw new InterviewNotFound;

        if (! $interview->belongsToEmployer($employerId)) {
            throw new InterviewAccessDenied;
        }

        $updated = $this->interviews->save($interview->cancel(new DateTimeImmutable));
        $this->notifier->notifyCandidateOfCancellation($updated);

        return $updated;
    }
}
