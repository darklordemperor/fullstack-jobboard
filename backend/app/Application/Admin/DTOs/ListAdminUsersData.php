<?php

namespace App\Application\Admin\DTOs;

use App\Domain\Admin\Enums\AdminUserStatus;
use App\Domain\Auth\Enums\UserRole;

final readonly class ListAdminUsersData
{
    public function __construct(
        public ?string $search = null,
        public ?UserRole $role = null,
        public ?AdminUserStatus $status = null,
        public int $page = 1,
        public int $perPage = 10,
    ) {}
}
