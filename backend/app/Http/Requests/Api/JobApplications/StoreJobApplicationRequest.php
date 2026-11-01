<?php

namespace App\Http\Requests\Api\JobApplications;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StoreJobApplicationRequest extends FormRequest
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
            'coverLetter' => ['required', 'string', 'min:50', 'max:5000'],
            'resume' => ['nullable', File::types(['pdf'])->max(5 * 1024)],
        ];
    }
}
