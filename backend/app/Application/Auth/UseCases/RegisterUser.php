<?php

namespace App\Application\Auth\UseCases;

use App\Application\Auth\Contracts\AuthSession;
use App\Application\Auth\Contracts\PasswordHasher;
use App\Application\Auth\DTOs\RegisterUserData;
use App\Application\Auth\Exceptions\EmailAlreadyRegistered;
use App\Domain\Auth\Entities\User;
use App\Domain\Auth\Repositories\UserRepository;
use App\Domain\Auth\ValueObjects\Email;
use App\Domain\Auth\ValueObjects\UserName;

final readonly class RegisterUser
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $passwordHasher,
        private AuthSession $authSession,
    ) {}

    public function execute(RegisterUserData $data): User
    {
        $email = new Email($data->email);

        if ($this->users->existsByEmail($email)) {
            throw new EmailAlreadyRegistered;
        }

        $user = $this->users->create(
            new UserName($data->name),
            $email,
            $this->passwordHasher->hash($data->password),
            $data->role,
        );

        $this->authSession->login($user->id);

        return $user;
    }
}
