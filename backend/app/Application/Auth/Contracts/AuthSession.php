<?php

namespace App\Application\Auth\Contracts;

interface AuthSession
{
    public function login(int $userId): void;

    public function currentUserId(): ?int;

    public function logout(): void;
}
