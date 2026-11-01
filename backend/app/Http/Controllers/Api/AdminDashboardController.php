<?php

namespace App\Http\Controllers\Api;

use App\Application\Admin\DTOs\ListAdminUsersData;
use App\Application\Admin\DTOs\UpdateAdminUserData;
use App\Application\Admin\UseCases\GetAdminDashboard;
use App\Application\Admin\UseCases\ListAdminUsers;
use App\Application\Admin\UseCases\UpdateAdminUser;
use App\Domain\Admin\Enums\AdminUserStatus;
use App\Domain\Auth\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\SearchAdminUsersRequest;
use App\Http\Requests\Api\Admin\ShowAdminDashboardRequest;
use App\Http\Requests\Api\Admin\UpdateAdminUserRequest;
use App\Http\Resources\AdminDashboardResource;
use App\Support\ApiResponse;
use DateTimeZone;
use DomainException;
use Illuminate\Http\JsonResponse;

final class AdminDashboardController extends Controller
{
    public function __invoke(
        ShowAdminDashboardRequest $request,
        GetAdminDashboard $getAdminDashboard,
    ): JsonResponse {
        return ApiResponse::success(
            AdminDashboardResource::make($getAdminDashboard->execute()),
            'Admin dashboard retrieved.',
        );
    }

    public function users(
        SearchAdminUsersRequest $request,
        ListAdminUsers $listAdminUsers,
    ): JsonResponse {
        $page = $listAdminUsers->execute(new ListAdminUsersData(
            search: $request->validated('search'),
            role: $request->enum('role', UserRole::class),
            status: $request->enum('status', AdminUserStatus::class),
            page: $request->integer('page', 1),
            perPage: $request->integer('perPage', 10),
        ));

        return ApiResponse::success([
            'items' => array_map(fn ($user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'status' => $user->status->value,
                'createdAt' => $user->createdAt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.u\Z'),
            ], $page->items),
            'pagination' => [
                'currentPage' => $page->currentPage,
                'perPage' => $page->perPage,
                'lastPage' => $page->lastPage,
                'total' => $page->total,
            ],
        ], 'Admin user directory retrieved.');
    }

    public function updateUser(
        UpdateAdminUserRequest $request,
        int $user,
        UpdateAdminUser $updateAdminUser,
    ): JsonResponse {
        try {
            $updated = $updateAdminUser->execute(new UpdateAdminUserData(
                adminId: (int) $request->user()->getAuthIdentifier(),
                targetUserId: $user,
                role: $request->has('role') && $request->validated('role') !== null
                    ? $request->enum('role', UserRole::class)
                    : null,
                suspended: $request->has('suspended')
                    ? $request->boolean('suspended')
                    : null,
            ));
        } catch (DomainException $exception) {
            return ApiResponse::error($exception->getMessage(), 422, [
                'user' => [$exception->getMessage()],
            ]);
        }

        return ApiResponse::success([
            'id' => $updated->id,
            'name' => $updated->name,
            'email' => $updated->email,
            'role' => $updated->role->value,
            'status' => $updated->status->value,
            'createdAt' => $updated->createdAt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.u\Z'),
        ], 'User updated successfully.');
    }
}
