<?php

namespace App\Application\Admin\UseCases;

use App\Application\Admin\DTOs\ListAdminUsersData;
use App\Domain\Admin\Repositories\AdminDashboardRepository;
use App\Domain\Admin\ValueObjects\AdminUserPage;

final readonly class ListAdminUsers
{
    public function __construct(private AdminDashboardRepository $dashboards) {}

    public function execute(ListAdminUsersData $data): AdminUserPage
    {
        $normalizedSearch = $data->search === null ? null : trim($data->search);

        return $this->dashboards->searchUsers(
            search: $normalizedSearch === '' ? null : $normalizedSearch,
            role: $data->role,
            status: $data->status,
            page: max(1, $data->page),
            perPage: min(50, max(1, $data->perPage)),
        );
    }
}
