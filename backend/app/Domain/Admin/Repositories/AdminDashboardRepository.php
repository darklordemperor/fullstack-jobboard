<?php

namespace App\Domain\Admin\Repositories;

use App\Domain\Admin\Entities\AdminDashboard;
use App\Domain\Admin\Enums\AdminUserStatus;
use App\Domain\Admin\ValueObjects\AdminUserPage;
use App\Domain\Admin\ValueObjects\AdminUserSummary;
use App\Domain\Auth\Enums\UserRole;

interface AdminDashboardRepository
{
    public function get(): AdminDashboard;

    public function searchUsers(
        ?string $search,
        ?UserRole $role,
        ?AdminUserStatus $status,
        int $page,
        int $perPage,
    ): AdminUserPage;

    public function findUserById(int $userId): ?AdminUserSummary;

    public function countActiveAdmins(): int;

    public function updateUser(
        int $userId,
        ?UserRole $role,
        ?bool $suspended,
    ): AdminUserSummary;
}
