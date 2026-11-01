<?php

namespace App\Application\Auth\Contracts;

use App\Domain\Auth\ValueObjects\PasswordHash;

interface PasswordHasher
{
    public function hash(string $plainTextPassword): PasswordHash;

    public function verify(string $plainTextPassword, PasswordHash $passwordHash): bool;
}
