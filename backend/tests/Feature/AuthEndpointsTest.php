<?php

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
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

    $this->getJson('/api/v1/me')
        ->assertSuccessful()
        ->assertJsonPath('data.email', 'auth-test@jobboard.com')
        ->assertJsonMissingPath('data.user');
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

test('authenticated user can update profile details and change password', function () {
    $user = User::factory()->create([
        'name' => 'Original Candidate',
        'email' => 'original@jobboard.com',
        'password' => Hash::make('password'),
        'role' => 'jobseeker',
    ]);
    User::factory()->create([
        'email' => 'already-used@jobboard.com',
    ]);

    $this->actingAs($user, 'sanctum')
        ->patchJson('/api/v1/auth/profile', [
            'name' => 'Updated Candidate',
            'email' => 'already-used@jobboard.com',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    $this->actingAs($user, 'sanctum')
        ->patchJson('/api/v1/auth/profile', [
            'name' => 'Updated Candidate',
            'email' => 'updated@jobboard.com',
            'currentPassword' => 'wrong-password',
            'newPassword' => 'NewSecret123!',
            'newPassword_confirmation' => 'NewSecret123!',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['currentPassword']);

    $this->actingAs($user, 'sanctum')
        ->patchJson('/api/v1/auth/profile', [
            'name' => 'Updated Candidate',
            'email' => 'updated@jobboard.com',
            'currentPassword' => 'password',
            'newPassword' => 'NewSecret123!',
            'newPassword_confirmation' => 'NewSecret123!',
        ])
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Updated Candidate')
        ->assertJsonPath('data.email', 'updated@jobboard.com');

    $user->refresh();
    expect($user->name)->toBe('Updated Candidate')
        ->and($user->email)->toBe('updated@jobboard.com')
        ->and(Hash::check('NewSecret123!', $user->password))->toBeTrue();
});

test('login requests are rate limited after 5 attempts', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'rate-limit-test@jobboard.com',
            'password' => 'wrong-password',
        ]);
    }

    $this->postJson('/api/v1/auth/login', [
        'email' => 'rate-limit-test@jobboard.com',
        'password' => 'wrong-password',
    ])->assertStatus(429)
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Too Many Attempts.');
});
