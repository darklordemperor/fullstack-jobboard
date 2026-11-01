<?php

use App\Application\Admin\DTOs\ListAdminUsersData;
use App\Application\Admin\DTOs\UpdateAdminUserData;
use App\Application\Admin\UseCases\GetAdminDashboard;
use App\Application\Admin\UseCases\ListAdminUsers;
use App\Application\Admin\UseCases\UpdateAdminUser;
use App\Domain\Admin\Entities\AdminDashboard;
use App\Domain\Admin\Enums\AdminUserStatus;
use App\Domain\Admin\Repositories\AdminDashboardRepository;
use App\Domain\Admin\ValueObjects\AdminDashboardStats;
use App\Domain\Admin\ValueObjects\AdminMetric;
use App\Domain\Admin\ValueObjects\AdminUserPage;
use App\Domain\Admin\ValueObjects\AdminUserSummary;
use App\Domain\Auth\Enums\UserRole;

test('admin dashboard use case returns the repository read model', function () {
    $metric = new AdminMetric(0, 0.0);
    $dashboard = new AdminDashboard(
        stats: new AdminDashboardStats($metric, $metric, $metric, $metric, $metric, $metric),
        employers: 0,
        jobseekers: 0,
        growth: [],
        recentActivity: [],
        latestUsers: [],
        generatedAt: new DateTimeImmutable('2026-10-30T12:00:00+00:00'),
    );
    $userPage = new AdminUserPage(items: [], currentPage: 1, perPage: 10, lastPage: 1, total: 0);
    $repository = new class($dashboard, $userPage) implements AdminDashboardRepository
    {
        public ?string $lastSearch = null;

        public function __construct(
            private readonly AdminDashboard $dashboard,
            private readonly AdminUserPage $userPage,
        ) {}

        public function get(): AdminDashboard
        {
            return $this->dashboard;
        }

        public function searchUsers(
            ?string $search,
            ?UserRole $role,
            ?AdminUserStatus $status,
            int $page,
            int $perPage,
        ): AdminUserPage {
            $this->lastSearch = $search;

            return $this->userPage;
        }

        public function findUserById(int $userId): ?AdminUserSummary
        {
            return null;
        }

        public function countActiveAdmins(): int
        {
            return 1;
        }

        public function updateUser(
            int $userId,
            ?UserRole $role,
            ?bool $suspended,
        ): AdminUserSummary {
            return new AdminUserSummary(
                id: $userId,
                name: 'Updated User',
                email: 'updated@example.com',
                role: $role ?? UserRole::Jobseeker,
                status: $suspended ? AdminUserStatus::Suspended : AdminUserStatus::Verified,
                createdAt: new DateTimeImmutable('2026-10-30T12:00:00+00:00'),
            );
        }
    };

    expect((new GetAdminDashboard($repository))->execute())->toBe($dashboard);

    $result = (new ListAdminUsers($repository))->execute(new ListAdminUsersData(search: '  Jane  '));
    expect($result)->toBe($userPage)
        ->and($repository->lastSearch)->toBe('Jane');
});

test('update admin user use case updates user and returns summary', function () {
    $user = new AdminUserSummary(
        id: 2,
        name: 'Target User',
        email: 'target@example.com',
        role: UserRole::Jobseeker,
        status: AdminUserStatus::Verified,
        createdAt: new DateTimeImmutable('2026-10-30T12:00:00+00:00'),
    );

    $repository = new class($user) implements AdminDashboardRepository
    {
        public function __construct(private AdminUserSummary $user) {}

        public function get(): AdminDashboard
        {
            throw new BadMethodCallException;
        }

        public function searchUsers(
            ?string $search,
            ?UserRole $role,
            ?AdminUserStatus $status,
            int $page,
            int $perPage,
        ): AdminUserPage {
            throw new BadMethodCallException;
        }

        public function findUserById(int $userId): ?AdminUserSummary
        {
            return $this->user;
        }

        public function countActiveAdmins(): int
        {
            return 2;
        }

        public function updateUser(
            int $userId,
            ?UserRole $role,
            ?bool $suspended,
        ): AdminUserSummary {
            return new AdminUserSummary(
                id: $userId,
                name: $this->user->name,
                email: $this->user->email,
                role: $role ?? $this->user->role,
                status: $suspended ? AdminUserStatus::Suspended : $this->user->status,
                createdAt: $this->user->createdAt,
            );
        }
    };

    $useCase = new UpdateAdminUser($repository);
    $result = $useCase->execute(new UpdateAdminUserData(
        adminId: 1,
        targetUserId: 2,
        role: UserRole::Employer,
        suspended: true,
    ));

    expect($result->id)->toBe(2)
        ->and($result->role)->toBe(UserRole::Employer)
        ->and($result->status)->toBe(AdminUserStatus::Suspended);
});
