<?php

namespace App\Infrastructure\Security;

use App\Application\Auth\Contracts\PasswordHasher;
use App\Domain\Auth\ValueObjects\PasswordHash;
use Illuminate\Contracts\Hashing\Hasher;

final readonly class LaravelPasswordHasher implements PasswordHasher
{
    public function __construct(private Hasher $hasher) {}

    public function hash(string $plainTextPassword): PasswordHash
    {
        return new PasswordHash($this->hasher->make($plainTextPassword));
    }

    public function verify(string $plainTextPassword, PasswordHash $passwordHash): bool
    {
        return $this->hasher->check($plainTextPassword, $passwordHash->value);
    }
}
