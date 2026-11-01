<?php

namespace App\Http\Requests\Api\JobApplications;

use App\Domain\JobApplications\Enums\JobApplicationStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobApplicationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'employer';
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(array_map(
                fn (JobApplicationStatus $status): string => $status->value,
                JobApplicationStatus::employerManagedCases(),
            ))],
        ];
    }
}
