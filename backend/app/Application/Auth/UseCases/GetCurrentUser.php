<?php

namespace App\Application\Auth\UseCases;

use App\Application\Auth\Contracts\AuthSession;
use App\Application\Auth\Exceptions\UnauthenticatedUser;
use App\Domain\Auth\Entities\User;
use App\Domain\Auth\Repositories\UserRepository;

final readonly class GetCurrentUser
{
    public function __construct(
        private UserRepository $users,
        private AuthSession $authSession,
    ) {}

    public function execute(): User
    {
        $userId = $this->authSession->currentUserId();
        $user = $userId === null ? null : $this->users->findById($userId);

        if ($user === null) {
            throw new UnauthenticatedUser;
        }

        return $user;
    }
}
