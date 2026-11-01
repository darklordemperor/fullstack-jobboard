<?php

namespace App\Http\Requests\Api\JobListings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ManageSavedJobListingsRequest extends FormRequest
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
        return [];
    }
}
