<?php

namespace App\Domain\Admin\ValueObjects;

use App\Domain\Admin\Enums\AdminUserStatus;
use App\Domain\Auth\Enums\UserRole;
use DateTimeImmutable;

final readonly class AdminUserSummary
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public UserRole $role,
        public AdminUserStatus $status,
        public DateTimeImmutable $createdAt,
    ) {}
}
