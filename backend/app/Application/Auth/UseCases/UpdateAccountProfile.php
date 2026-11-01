<?php

namespace App\Application\Auth\UseCases;

use App\Application\Auth\Contracts\PasswordHasher;
use App\Application\Auth\DTOs\UpdateAccountProfileData;
use App\Application\Auth\Exceptions\EmailAlreadyRegistered;
use App\Application\Auth\Exceptions\InvalidCredentials;
use App\Domain\Auth\Entities\User;
use App\Domain\Auth\Repositories\UserRepository;
use App\Domain\Auth\ValueObjects\Email;
use App\Domain\Auth\ValueObjects\UserName;

final readonly class UpdateAccountProfile
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $passwordHasher,
    ) {}

    public function execute(UpdateAccountProfileData $data): User
    {
        $user = $this->users->findById($data->userId);

        if ($user === null) {
            throw new InvalidCredentials;
        }

        $name = new UserName($data->name);
        $email = new Email($data->email);

        if ($email->value !== $user->email->value && $this->users->existsByEmail($email)) {
            throw new EmailAlreadyRegistered;
        }

        $newPasswordHash = null;

        if ($data->newPassword !== null && $data->newPassword !== '') {
            if (
                $data->currentPassword === null
                || $data->currentPassword === ''
                || ! $this->passwordHasher->verify($data->currentPassword, $user->passwordHash)
            ) {
                throw new InvalidCredentials;
            }

            $newPasswordHash = $this->passwordHasher->hash($data->newPassword);
        }

        return $this->users->save($user->updateProfile($name, $email, $newPasswordHash));
    }
}
