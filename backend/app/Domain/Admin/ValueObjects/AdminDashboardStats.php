<?php

namespace App\Domain\Admin\ValueObjects;

final readonly class AdminDashboardStats
{
    public function __construct(
        public AdminMetric $totalUsers,
        public AdminMetric $totalEmployers,
        public AdminMetric $totalJobseekers,
        public AdminMetric $totalJobListings,
        public AdminMetric $applicationsToday,
        public AdminMetric $hiresThisMonth,
    ) {}
}
