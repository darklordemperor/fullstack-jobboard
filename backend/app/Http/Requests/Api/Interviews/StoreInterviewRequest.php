<?php

namespace App\Http\Requests\Api\Interviews;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreInterviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'employer';
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'scheduledAt' => ['required', 'date', 'after:now'],
            'durationMinutes' => ['required', 'integer', 'min:15', 'max:480'],
            'timezone' => ['required', 'string', 'timezone:all', 'max:64'],
            'location' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
