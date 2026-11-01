<?php

namespace App\Http\Requests\Api\Interviews;

class SearchCandidateInterviewsRequest extends SearchEmployerInterviewsRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'jobseeker';
    }
}
