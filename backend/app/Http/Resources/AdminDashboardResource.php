<?php

namespace App\Http\Resources;

use App\Domain\Admin\Entities\AdminDashboard;
use App\Domain\Admin\ValueObjects\AdminMetric;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AdminDashboardResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var AdminDashboard $dashboard */
        $dashboard = $this->resource;

        return [
            'stats' => [
                'totalUsers' => $this->metric($dashboard->stats->totalUsers),
                'totalEmployers' => $this->metric($dashboard->stats->totalEmployers),
                'totalJobseekers' => $this->metric($dashboard->stats->totalJobseekers),
                'totalJobListings' => $this->metric($dashboard->stats->totalJobListings),
                'applicationsToday' => $this->metric($dashboard->stats->applicationsToday),
                'hiresThisMonth' => $this->metric($dashboard->stats->hiresThisMonth),
            ],
            'userDistribution' => [
                'employers' => $dashboard->employers,
                'jobseekers' => $dashboard->jobseekers,
            ],
            'growth' => array_map(fn ($point): array => [
                'month' => $point->month,
                'newUsers' => $point->newUsers,
                'newJobListings' => $point->newJobListings,
                'applications' => $point->applications,
            ], $dashboard->growth),
            'recentActivity' => array_map(fn ($activity): array => [
                'type' => $activity->type->value,
                'description' => $activity->description,
                'occurredAt' => $this->utc($activity->occurredAt),
            ], $dashboard->recentActivity),
            'latestUsers' => array_map(fn ($user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'status' => $user->status->value,
                'createdAt' => $this->utc($user->createdAt),
            ], $dashboard->latestUsers),
            'generatedAt' => $this->utc($dashboard->generatedAt),
        ];
    }

    /** @return array{value: int, changePercent: float|null} */
    private function metric(AdminMetric $metric): array
    {
        return [
            'value' => $metric->value,
            'changePercent' => $metric->changePercent,
        ];
    }

    private function utc(DateTimeImmutable $value): string
    {
        return $value->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.u\Z');
    }
}
