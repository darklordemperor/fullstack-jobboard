<?php

namespace App\Http\Requests\Api\JobApplications;

use App\Domain\JobApplications\Enums\JobApplicationStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SearchJobseekerApplicationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'jobseeker';
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::enum(JobApplicationStatus::class)],
            'search' => ['nullable', 'string', 'max:100'],
            'jobListingId' => ['nullable', 'integer', 'min:1'],
            'page' => ['nullable', 'integer', 'min:1'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
