<?php

namespace App\Infrastructure\Auth;

use App\Application\Auth\Contracts\AuthSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final readonly class LaravelAuthSession implements AuthSession
{
    public function __construct(private Request $request) {}

    public function login(int $userId): void
    {
        Auth::guard('web')->loginUsingId($userId);
        $this->request->session()->regenerate();
    }

    public function currentUserId(): ?int
    {
        $id = Auth::guard('web')->id();

        return $id === null ? null : (int) $id;
    }

    public function logout(): void
    {
        Auth::guard('web')->logout();
        $this->request->session()->invalidate();
        $this->request->session()->regenerateToken();
    }
}
