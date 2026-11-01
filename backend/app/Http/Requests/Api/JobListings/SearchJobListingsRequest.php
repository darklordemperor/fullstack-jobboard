<?php

namespace App\Http\Requests\Api\JobListings;

use App\Domain\JobListings\Enums\EmploymentType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SearchJobListingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('savedOnly') && is_string($this->input('savedOnly'))) {
            $parsed = filter_var($this->input('savedOnly'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($parsed !== null) {
                $this->merge(['savedOnly' => $parsed]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'keyword' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],
            'employmentTypes' => ['nullable', 'array', 'max:4'],
            'employmentTypes.*' => [Rule::enum(EmploymentType::class)],
            'salaryCap' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'category' => ['nullable', 'string', 'max:100'],
            'savedOnly' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['newest', 'salary_desc'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
