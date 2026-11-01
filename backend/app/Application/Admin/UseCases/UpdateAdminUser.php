<?php

namespace App\Application\Admin\UseCases;

use App\Application\Admin\DTOs\UpdateAdminUserData;
use App\Domain\Admin\Repositories\AdminDashboardRepository;
use App\Domain\Admin\ValueObjects\AdminUserSummary;
use App\Domain\Auth\Enums\UserRole;
use DomainException;

final readonly class UpdateAdminUser
{
    public function __construct(private AdminDashboardRepository $dashboards) {}

    public function execute(UpdateAdminUserData $data): AdminUserSummary
    {
        $target = $this->dashboards->findUserById($data->targetUserId);

        if ($target === null) {
            throw new DomainException('User not found.');
        }

        if ($data->adminId === $data->targetUserId) {
            if ($data->suspended === true) {
                throw new DomainException('You cannot suspend your own account.');
            }

            if ($data->role !== null && $data->role !== UserRole::Admin) {
                throw new DomainException('You cannot demote your own admin account.');
            }
        }

        if ($target->role === UserRole::Admin && ($data->suspended === true || ($data->role !== null && $data->role !== UserRole::Admin))) {
            $adminCount = $this->dashboards->countActiveAdmins();

            if ($adminCount <= 1) {
                throw new DomainException('Cannot modify or suspend the last active administrator.');
            }
        }

        return $this->dashboards->updateUser(
            userId: $data->targetUserId,
            role: $data->role,
            suspended: $data->suspended,
        );
    }
}
