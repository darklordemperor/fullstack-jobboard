<?php

namespace App\Application\Auth\UseCases;

use App\Application\Auth\Contracts\AuthSession;
use App\Application\Auth\Contracts\PasswordHasher;
use App\Application\Auth\DTOs\LoginData;
use App\Application\Auth\Exceptions\AccountSuspended;
use App\Application\Auth\Exceptions\InvalidCredentials;
use App\Domain\Auth\Entities\User;
use App\Domain\Auth\Repositories\UserRepository;
use App\Domain\Auth\ValueObjects\Email;

final readonly class LoginUser
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $passwordHasher,
        private AuthSession $authSession,
    ) {}

    public function execute(LoginData $data): User
    {
        $user = $this->users->findByEmail(new Email($data->email));

        if ($user === null || ! $this->passwordHasher->verify($data->password, $user->passwordHash)) {
            throw new InvalidCredentials;
        }

        if ($user->isSuspended()) {
            throw new AccountSuspended;
        }

        $this->authSession->login($user->id);

        return $user;
    }
}
