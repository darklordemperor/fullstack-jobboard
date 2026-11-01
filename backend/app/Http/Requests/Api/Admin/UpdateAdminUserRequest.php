<?php

namespace App\Http\Requests\Api\Admin;

use App\Domain\Auth\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'role' => ['nullable', Rule::enum(UserRole::class)],
            'suspended' => ['nullable', 'boolean'],
        ];
    }
}
