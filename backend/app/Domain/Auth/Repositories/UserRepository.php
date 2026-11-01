<?php

namespace App\Domain\Auth\Repositories;

use App\Domain\Auth\Entities\User;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\ValueObjects\Email;
use App\Domain\Auth\ValueObjects\PasswordHash;
use App\Domain\Auth\ValueObjects\UserName;

interface UserRepository
{
    public function findById(int $id): ?User;

    public function findByEmail(Email $email): ?User;

    public function existsByEmail(Email $email): bool;

    public function create(
        UserName $name,
        Email $email,
        PasswordHash $passwordHash,
        UserRole $role,
    ): User;

    public function save(User $user): User;
}
