<?php

namespace App\Domain\Admin\Entities;

use App\Domain\Admin\ValueObjects\AdminActivity;
use App\Domain\Admin\ValueObjects\AdminDashboardStats;
use App\Domain\Admin\ValueObjects\AdminGrowthPoint;
use App\Domain\Admin\ValueObjects\AdminUserSummary;
use DateTimeImmutable;

final readonly class AdminDashboard
{
    /**
     * @param  list<AdminGrowthPoint>  $growth
     * @param  list<AdminActivity>  $recentActivity
     * @param  list<AdminUserSummary>  $latestUsers
     */
    public function __construct(
        public AdminDashboardStats $stats,
        public int $employers,
        public int $jobseekers,
        public array $growth,
        public array $recentActivity,
        public array $latestUsers,
        public DateTimeImmutable $generatedAt,
    ) {}
}
