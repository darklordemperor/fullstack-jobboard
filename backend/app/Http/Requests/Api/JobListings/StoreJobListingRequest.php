<?php

namespace App\Http\Requests\Api\JobListings;

use App\Domain\JobListings\Enums\EmploymentType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobListingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'employer';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'min:50', 'max:20000'],
            'location' => ['required', 'string', 'max:100'],
            'employmentType' => ['required', Rule::enum(EmploymentType::class)],
            'category' => ['required', 'string', 'max:100'],
            'salaryMinimum' => ['required', 'integer', 'min:0', 'max:10000000'],
            'salaryMaximum' => ['required', 'integer', 'gte:salaryMinimum', 'max:10000000'],
        ];
    }
}
