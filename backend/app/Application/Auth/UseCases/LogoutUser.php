<?php

namespace App\Application\Auth\UseCases;

use App\Application\Auth\Contracts\AuthSession;

final readonly class LogoutUser
{
    public function __construct(private AuthSession $authSession) {}

    public function execute(): void
    {
        $this->authSession->logout();
    }
}
