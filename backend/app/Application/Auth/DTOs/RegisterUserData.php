<?php

namespace App\Application\Auth\DTOs;

use App\Domain\Auth\Enums\UserRole;

final readonly class RegisterUserData
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public UserRole $role = UserRole::Jobseeker,
    ) {}
}
