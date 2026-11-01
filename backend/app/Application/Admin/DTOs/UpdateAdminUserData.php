<?php

namespace App\Application\Admin\DTOs;

use App\Domain\Auth\Enums\UserRole;

final readonly class UpdateAdminUserData
{
    public function __construct(
        public int $adminId,
        public int $targetUserId,
        public ?UserRole $role = null,
        public ?bool $suspended = null,
    ) {}
}
