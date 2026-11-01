<?php

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\Admin\Entities\AdminDashboard;
use App\Domain\Admin\Enums\AdminActivityType;
use App\Domain\Admin\Enums\AdminUserStatus;
use App\Domain\Admin\Repositories\AdminDashboardRepository;
use App\Domain\Admin\ValueObjects\AdminActivity;
use App\Domain\Admin\ValueObjects\AdminDashboardStats;
use App\Domain\Admin\ValueObjects\AdminGrowthPoint;
use App\Domain\Admin\ValueObjects\AdminMetric;
use App\Domain\Admin\ValueObjects\AdminUserPage;
use App\Domain\Admin\ValueObjects\AdminUserSummary;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Domain\JobListings\Enums\JobListingStatus;
use App\Models\JobApplication;
use App\Models\JobListing;
use App\Models\User;
use App\Support\LikeQuery;
use Carbon\CarbonImmutable;
use DateTimeImmutable;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use LogicException;

final class EloquentAdminDashboardRepository implements AdminDashboardRepository
{
    public function get(): AdminDashboard
    {
        $now = CarbonImmutable::now();
        $currentMonthStart = $now->startOfMonth();
        $previousMonthStart = $currentMonthStart->subMonth();
        $todayStart = $now->startOfDay();
        $yesterdayStart = $todayStart->subDay();

        $userStats = User::query()
            ->selectRaw('SUM(CASE WHEN role = ? THEN 1 ELSE 0 END) as employers', [UserRole::Employer->value])
            ->selectRaw('SUM(CASE WHEN role = ? THEN 1 ELSE 0 END) as jobseekers', [UserRole::Jobseeker->value])
            ->selectRaw('SUM(CASE WHEN role IN (?, ?) AND created_at >= ? AND created_at <= ? THEN 1 ELSE 0 END) as current_users', [
                UserRole::Employer->value,
                UserRole::Jobseeker->value,
                $currentMonthStart,
                $now,
            ])
            ->selectRaw('SUM(CASE WHEN role IN (?, ?) AND created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) as previous_users', [
                UserRole::Employer->value,
                UserRole::Jobseeker->value,
                $previousMonthStart,
                $currentMonthStart,
            ])
            ->selectRaw('SUM(CASE WHEN role = ? AND created_at >= ? AND created_at <= ? THEN 1 ELSE 0 END) as current_employers', [
                UserRole::Employer->value,
                $currentMonthStart,
                $now,
            ])
            ->selectRaw('SUM(CASE WHEN role = ? AND created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) as previous_employers', [
                UserRole::Employer->value,
                $previousMonthStart,
                $currentMonthStart,
            ])
            ->selectRaw('SUM(CASE WHEN role = ? AND created_at >= ? AND created_at <= ? THEN 1 ELSE 0 END) as current_jobseekers', [
                UserRole::Jobseeker->value,
                $currentMonthStart,
                $now,
            ])
            ->selectRaw('SUM(CASE WHEN role = ? AND created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) as previous_jobseekers', [
                UserRole::Jobseeker->value,
                $previousMonthStart,
                $currentMonthStart,
            ])
            ->first();

        $jobStats = JobListing::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN created_at >= ? AND created_at <= ? THEN 1 ELSE 0 END) as current_count', [
                $currentMonthStart,
                $now,
            ])
            ->selectRaw('SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) as previous_count', [
                $previousMonthStart,
                $currentMonthStart,
            ])
            ->first();

        $applicationStats = JobApplication::query()
            ->selectRaw('SUM(CASE WHEN created_at >= ? AND created_at <= ? THEN 1 ELSE 0 END) as today_count', [
                $todayStart,
                $now,
            ])
            ->selectRaw('SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) as yesterday_count', [
                $yesterdayStart,
                $todayStart,
            ])
            ->selectRaw('SUM(CASE WHEN status = ? AND status_changed_at >= ? AND status_changed_at <= ? THEN 1 ELSE 0 END) as current_hires', [
                JobApplicationStatus::Hired->value,
                $currentMonthStart,
                $now,
            ])
            ->selectRaw('SUM(CASE WHEN status = ? AND status_changed_at >= ? AND status_changed_at < ? THEN 1 ELSE 0 END) as previous_hires', [
                JobApplicationStatus::Hired->value,
                $previousMonthStart,
                $currentMonthStart,
            ])
            ->first();

        $employers = (int) ($userStats?->employers ?? 0);
        $jobseekers = (int) ($userStats?->jobseekers ?? 0);

        return new AdminDashboard(
            stats: new AdminDashboardStats(
                totalUsers: $this->metric(
                    $employers + $jobseekers,
                    (int) ($userStats?->current_users ?? 0),
                    (int) ($userStats?->previous_users ?? 0),
                ),
                totalEmployers: $this->metric(
                    $employers,
                    (int) ($userStats?->current_employers ?? 0),
                    (int) ($userStats?->previous_employers ?? 0),
                ),
                totalJobseekers: $this->metric(
                    $jobseekers,
                    (int) ($userStats?->current_jobseekers ?? 0),
                    (int) ($userStats?->previous_jobseekers ?? 0),
                ),
                totalJobListings: $this->metric(
                    (int) ($jobStats?->total ?? 0),
                    (int) ($jobStats?->current_count ?? 0),
                    (int) ($jobStats?->previous_count ?? 0),
                ),
                applicationsToday: $this->metric(
                    (int) ($applicationStats?->today_count ?? 0),
                    (int) ($applicationStats?->today_count ?? 0),
                    (int) ($applicationStats?->yesterday_count ?? 0),
                ),
                hiresThisMonth: $this->metric(
                    (int) ($applicationStats?->current_hires ?? 0),
                    (int) ($applicationStats?->current_hires ?? 0),
                    (int) ($applicationStats?->previous_hires ?? 0),
                ),
            ),
            employers: $employers,
            jobseekers: $jobseekers,
            growth: $this->growth($now),
            recentActivity: $this->recentActivity(),
            latestUsers: $this->latestUsers(),
            generatedAt: DateTimeImmutable::createFromInterface($now),
        );
    }

    public function searchUsers(
        ?string $search,
        ?UserRole $role,
        ?AdminUserStatus $status,
        int $page,
        int $perPage,
    ): AdminUserPage {
        $paginator = User::query()
            ->select(['id', 'name', 'email', 'role', 'email_verified_at', 'suspended_at', 'created_at'])
            ->when($search !== null && $search !== '', function (Builder $query) use ($search): void {
                $pattern = LikeQuery::pattern($search);
                $query->where(function (Builder $nested) use ($pattern): void {
                    $nested->whereRaw("name LIKE ? ESCAPE '\\'", [$pattern])
                        ->orWhereRaw("email LIKE ? ESCAPE '\\'", [$pattern]);
                });
            })
            ->when($role, fn (Builder $query, UserRole $role) => $query->where('role', $role->value))
            ->when($status, function (Builder $query, AdminUserStatus $status): void {
                if ($status === AdminUserStatus::Suspended) {
                    $query->whereNotNull('suspended_at');
                } elseif ($status === AdminUserStatus::Verified) {
                    $query->whereNull('suspended_at')->whereNotNull('email_verified_at');
                } else {
                    $query->whereNull('suspended_at')->whereNull('email_verified_at');
                }
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(
                perPage: $perPage,
                columns: ['id', 'name', 'email', 'role', 'email_verified_at', 'suspended_at', 'created_at'],
                pageName: 'page',
                page: $page,
            );

        return new AdminUserPage(
            items: array_values(array_map($this->toUserSummary(...), $paginator->items())),
            currentPage: $paginator->currentPage(),
            perPage: $paginator->perPage(),
            lastPage: $paginator->lastPage(),
            total: $paginator->total(),
        );
    }

    public function findUserById(int $userId): ?AdminUserSummary
    {
        $user = User::query()->find($userId);

        return $user === null ? null : $this->toUserSummary($user);
    }

    public function countActiveAdmins(): int
    {
        return User::query()
            ->where('role', UserRole::Admin->value)
            ->whereNull('suspended_at')
            ->count();
    }

    public function updateUser(
        int $userId,
        ?UserRole $role,
        ?bool $suspended,
    ): AdminUserSummary {
        $user = User::query()->findOrFail($userId);

        if ($role !== null) {
            $user->role = $role->value;
        }

        if ($suspended !== null) {
            $user->suspended_at = $suspended ? now() : null;
        }

        $user->save();

        return $this->toUserSummary($user->refresh());
    }

    private function metric(int $value, int $currentPeriod, int $previousPeriod): AdminMetric
    {
        $changePercent = match (true) {
            $previousPeriod === 0 && $currentPeriod === 0 => 0.0,
            $previousPeriod === 0 => null,
            default => round((($currentPeriod - $previousPeriod) / $previousPeriod) * 100, 1),
        };

        return new AdminMetric($value, $changePercent);
    }

    /** @return list<AdminGrowthPoint> */
    private function growth(CarbonImmutable $now): array
    {
        $start = $now->startOfMonth()->subMonths(5);
        $end = $now->endOfMonth();
        $userCounts = $this->monthlyCounts(
            User::query()->whereIn('role', [UserRole::Employer->value, UserRole::Jobseeker->value]),
            'created_at',
            $start,
            $end,
        );
        $jobCounts = $this->monthlyCounts(JobListing::query(), 'created_at', $start, $end);
        $applicationCounts = $this->monthlyCounts(JobApplication::query(), 'created_at', $start, $end);
        $growth = [];

        for ($month = $start; $month <= $end; $month = $month->addMonth()) {
            $key = $month->format('Y-m');
            $growth[] = new AdminGrowthPoint(
                month: $key,
                newUsers: $userCounts[$key] ?? 0,
                newJobListings: $jobCounts[$key] ?? 0,
                applications: $applicationCounts[$key] ?? 0,
            );
        }

        return $growth;
    }

    /** @return array<string, int> */
    private function monthlyCounts(
        Builder $query,
        string $dateColumn,
        CarbonImmutable $start,
        CarbonImmutable $end,
    ): array {
        $qualifiedColumn = $query->getModel()->qualifyColumn($dateColumn);
        $expression = match ($query->getModel()->getConnection()->getDriverName()) {
            'mysql' => "DATE_FORMAT({$qualifiedColumn}, '%Y-%m')",
            'sqlite' => "strftime('%Y-%m', {$qualifiedColumn})",
            'pgsql' => "TO_CHAR({$qualifiedColumn}, 'YYYY-MM')",
            default => throw new LogicException('Unsupported database driver for admin growth aggregation.'),
        };

        $counts = $query
            ->whereBetween($dateColumn, [$start, $end])
            ->selectRaw("{$expression} as month_key, COUNT(*) as aggregate")
            ->groupBy('month_key')
            ->pluck('aggregate', 'month_key');

        $result = [];

        foreach ($counts as $month => $count) {
            $result[(string) $month] = (int) $count;
        }

        return $result;
    }

    /** @return list<AdminActivity> */
    private function recentActivity(): array
    {
        $activities = [];

        foreach (User::query()->whereIn('role', [UserRole::Employer->value, UserRole::Jobseeker->value])->latest()->limit(4)->get() as $user) {
            $activities[] = new AdminActivity(
                AdminActivityType::UserRegistered,
                sprintf('New %s registered: %s', $user->role, $user->name),
                $this->immutable($user->created_at),
            );
        }

        foreach (JobListing::query()->where('status', JobListingStatus::Published->value)->latest('published_at')->limit(4)->get() as $jobListing) {
            $activities[] = new AdminActivity(
                AdminActivityType::JobPublished,
                "Job published: {$jobListing->title}",
                $this->immutable($jobListing->published_at),
            );
        }

        foreach (JobApplication::query()->with('jobListing:id,title')->latest()->limit(4)->get() as $application) {
            $activities[] = new AdminActivity(
                AdminActivityType::ApplicationSubmitted,
                "Application submitted for {$application->jobListing->title}",
                $this->immutable($application->created_at),
            );
        }

        foreach (JobApplication::query()->with('jobListing:id,title')->where('status', JobApplicationStatus::Hired->value)->latest('status_changed_at')->limit(4)->get() as $application) {
            $activities[] = new AdminActivity(
                AdminActivityType::CandidateHired,
                "Candidate hired for {$application->jobListing->title}",
                $this->immutable($application->status_changed_at),
            );
        }

        usort(
            $activities,
            fn (AdminActivity $left, AdminActivity $right): int => $right->occurredAt->getTimestamp() <=> $left->occurredAt->getTimestamp(),
        );

        return array_slice($activities, 0, 6);
    }

    /** @return list<AdminUserSummary> */
    private function latestUsers(): array
    {
        return User::query()
            ->latest()
            ->limit(5)
            ->get(['id', 'name', 'email', 'role', 'email_verified_at', 'suspended_at', 'created_at'])
            ->map(fn (User $user): AdminUserSummary => $this->toUserSummary($user))
            ->values()
            ->all();
    }

    private function toUserSummary(User $user): AdminUserSummary
    {
        return new AdminUserSummary(
            id: (int) $user->id,
            name: (string) $user->name,
            email: (string) $user->email,
            role: UserRole::from((string) $user->role),
            status: match (true) {
                $user->suspended_at !== null => AdminUserStatus::Suspended,
                $user->email_verified_at !== null => AdminUserStatus::Verified,
                default => AdminUserStatus::Unverified,
            },
            createdAt: $this->immutable($user->created_at),
        );
    }

    private function immutable(?DateTimeInterface $value): DateTimeImmutable
    {
        if ($value === null) {
            throw new LogicException('Expected dashboard timestamp is missing.');
        }

        return DateTimeImmutable::createFromInterface($value);
    }
}
