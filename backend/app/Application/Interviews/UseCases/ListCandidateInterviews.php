<?php

namespace App\Application\Interviews\UseCases;

use App\Application\Interviews\DTOs\ListInterviewsData;
use App\Domain\Interviews\Repositories\InterviewRepository;
use App\Domain\Interviews\ValueObjects\InterviewPage;

final readonly class ListCandidateInterviews
{
    public function __construct(private InterviewRepository $interviews) {}

    public function execute(ListInterviewsData $data): InterviewPage
    {
        return $this->interviews->searchByCandidate(
            $data->userId,
            $data->status,
            $data->page,
            $data->perPage,
        );
    }
}
