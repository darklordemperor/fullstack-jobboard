<?php

namespace App\Http\Controllers\Api\Auth;

use App\Application\Auth\DTOs\RegisterUserData;
use App\Application\Auth\Exceptions\EmailAlreadyRegistered;
use App\Application\Auth\UseCases\RegisterUser;
use App\Domain\Auth\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class RegisteredUserController extends Controller
{
    public function store(RegisterRequest $request, RegisterUser $registerUser): JsonResponse
    {
        try {
            $user = $registerUser->execute(new RegisterUserData(
                name: $request->validated('name'),
                email: $request->validated('email'),
                password: $request->validated('password'),
                role: UserRole::from($request->validated('role', UserRole::Jobseeker->value)),
            ));
        } catch (EmailAlreadyRegistered $exception) {
            throw ValidationException::withMessages([
                'email' => [$exception->getMessage()],
            ]);
        }

        return ApiResponse::success(
            UserResource::make($user),
            'Account created successfully.',
            201
        );
    }
}
