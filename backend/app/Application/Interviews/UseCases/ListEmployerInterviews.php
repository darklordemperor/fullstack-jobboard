<?php

namespace App\Application\Interviews\UseCases;

use App\Application\Interviews\DTOs\ListInterviewsData;
use App\Domain\Interviews\Repositories\InterviewRepository;
use App\Domain\Interviews\ValueObjects\InterviewPage;

final readonly class ListEmployerInterviews
{
    public function __construct(private InterviewRepository $interviews) {}

    public function execute(ListInterviewsData $data): InterviewPage
    {
        return $this->interviews->searchByEmployer(
            $data->userId,
            $data->status,
            $data->page,
            $data->perPage,
        );
    }
}
