<?php

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    config([
        'database.default' => 'mysql',
        'database.connections.mysql.host' => '127.0.0.1',
        'database.connections.mysql.port' => 3306,
        'database.connections.mysql.database' => 'dashboard_api',
        'database.connections.mysql.username' => 'dashboard_api',
        'database.connections.mysql.password' => 'secret',
    ]);

    DB::purge('mysql');

    try {
        DB::connection()->getPdo();
    } catch (Throwable) {
        $this->markTestSkipped('MySQL test database is not available.');
    }

    User::query()
        ->whereIn('email', ['auth-test@jobboard.com', 'jane@example.com'])
        ->delete();

    $this->withHeader('referer', 'http://localhost:3000');
    $this->withoutMiddleware(ValidateCsrfToken::class);
});

test('user can log in with sanctum session credentials', function () {
    User::factory()->create([
        'email' => 'auth-test@jobboard.com',
        'password' => Hash::make('password'),
        'role' => 'admin',
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'auth-test@jobboard.com',
        'password' => 'password',
    ])->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.email', 'auth-test@jobboard.com')
        ->assertJsonPath('data.role', 'admin');

    $this->getJson('/api/v1/auth/me')
        ->assertSuccessful()
        ->assertJsonPath('data.email', 'auth-test@jobboard.com');
});

test('login returns validation errors for invalid credentials', function () {
    User::factory()->create([
        'email' => 'auth-test@jobboard.com',
        'password' => Hash::make('password'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'auth-test@jobboard.com',
        'password' => 'wrong-password',
    ])->assertUnprocessable()
        ->assertJsonPath('success', false)
        ->assertJsonValidationErrors(['email']);
});

test('user can register and log out', function () {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'Jane Candidate',
        'email' => 'jane@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'jobseeker',
    ])->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.email', 'jane@example.com')
        ->assertJsonPath('data.role', 'jobseeker');

    $this->postJson('/api/v1/auth/logout')
        ->assertSuccessful()
        ->assertJsonPath('success', true);
});
