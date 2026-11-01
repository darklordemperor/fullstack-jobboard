<?php

namespace App\Application\Admin\UseCases;

use App\Domain\Admin\Entities\AdminDashboard;
use App\Domain\Admin\Repositories\AdminDashboardRepository;

final readonly class GetAdminDashboard
{
    public function __construct(private AdminDashboardRepository $dashboards) {}

    public function execute(): AdminDashboard
    {
        return $this->dashboards->get();
    }
}
