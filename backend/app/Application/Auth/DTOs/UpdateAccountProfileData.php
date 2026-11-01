<?php

namespace App\Application\Auth\DTOs;

final readonly class UpdateAccountProfileData
{
    public function __construct(
        public int $userId,
        public string $name,
        public string $email,
        public ?string $currentPassword = null,
        public ?string $newPassword = null,
    ) {}
}
