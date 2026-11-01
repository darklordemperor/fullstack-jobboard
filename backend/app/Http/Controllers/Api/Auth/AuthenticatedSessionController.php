<?php

namespace App\Http\Controllers\Api\Auth;

use App\Application\Auth\DTOs\LoginData;
use App\Application\Auth\DTOs\UpdateAccountProfileData;
use App\Application\Auth\Exceptions\AccountSuspended;
use App\Application\Auth\Exceptions\EmailAlreadyRegistered;
use App\Application\Auth\Exceptions\InvalidCredentials;
use App\Application\Auth\UseCases\GetCurrentUser;
use App\Application\Auth\UseCases\LoginUser;
use App\Application\Auth\UseCases\LogoutUser;
use App\Application\Auth\UseCases\UpdateAccountProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Requests\Api\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    public function store(LoginRequest $request, LoginUser $loginUser): JsonResponse
    {
        try {
            $user = $loginUser->execute(new LoginData(
                email: $request->validated('email'),
                password: $request->validated('password'),
            ));
        } catch (InvalidCredentials $exception) {
            throw ValidationException::withMessages([
                'email' => [$exception->getMessage()],
            ]);
        } catch (AccountSuspended $exception) {
            return ApiResponse::error($exception->getMessage(), 403);
        }

        return ApiResponse::success(
            UserResource::make($user),
            'Signed in successfully.'
        );
    }

    public function show(GetCurrentUser $getCurrentUser): JsonResponse
    {
        return ApiResponse::success(
            UserResource::make($getCurrentUser->execute()),
            'Authenticated user retrieved.'
        );
    }

    public function update(UpdateProfileRequest $request, UpdateAccountProfile $updateAccountProfile): JsonResponse
    {
        try {
            $user = $updateAccountProfile->execute(new UpdateAccountProfileData(
                userId: (int) $request->user()?->getKey(),
                name: $request->validated('name'),
                email: $request->validated('email'),
                currentPassword: $request->validated('currentPassword'),
                newPassword: $request->validated('newPassword'),
            ));
        } catch (EmailAlreadyRegistered $exception) {
            throw ValidationException::withMessages([
                'email' => [$exception->getMessage()],
            ]);
        } catch (InvalidCredentials) {
            throw ValidationException::withMessages([
                'currentPassword' => ['The current password is incorrect.'],
            ]);
        }

        return ApiResponse::success(
            UserResource::make($user),
            'Account profile updated.'
        );
    }

    public function destroy(LogoutUser $logoutUser): JsonResponse
    {
        $logoutUser->execute();

        return ApiResponse::success(null, 'Signed out successfully.');
    }
}
