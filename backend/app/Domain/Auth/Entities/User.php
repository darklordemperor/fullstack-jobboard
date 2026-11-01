<?php

namespace App\Domain\Auth\Entities;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\ValueObjects\Email;
use App\Domain\Auth\ValueObjects\PasswordHash;
use App\Domain\Auth\ValueObjects\UserName;
use DateTimeImmutable;

final readonly class User
{
    public function __construct(
        public int $id,
        public UserName $name,
        public Email $email,
        public PasswordHash $passwordHash,
        public UserRole $role,
        public DateTimeImmutable $createdAt,
        public ?DateTimeImmutable $suspendedAt = null,
    ) {}

    public function isSuspended(): bool
    {
        return $this->suspendedAt !== null;
    }

    public function updateProfile(
        UserName $name,
        Email $email,
        ?PasswordHash $passwordHash = null,
    ): self {
        return new self(
            id: $this->id,
            name: $name,
            email: $email,
            passwordHash: $passwordHash ?? $this->passwordHash,
            role: $this->role,
            createdAt: $this->createdAt,
            suspendedAt: $this->suspendedAt,
        );
    }
}
