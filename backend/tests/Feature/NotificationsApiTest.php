<?php

use App\Models\User;
use App\Notifications\JobApplicationStatusChangedNotification;
use Illuminate\Support\Str;

test('notifications endpoints require authentication', function () {
    $this->getJson('/api/v1/notifications')->assertUnauthorized();
    $this->patchJson('/api/v1/notifications/non-existent-id/read')->assertUnauthorized();
    $this->postJson('/api/v1/notifications/read-all')->assertUnauthorized();
});

test('authenticated user can list paginated notifications and unread count', function () {
    $user = User::factory()->create();

    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => JobApplicationStatusChangedNotification::class,
        'data' => [
            'type' => 'job_application_status_changed',
            'title' => 'Application Status Updated',
            'message' => 'Your application for Senior Backend Engineer is now shortlisted.',
            'url' => '/jobseeker/applications',
        ],
        'read_at' => null,
    ]);

    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => JobApplicationStatusChangedNotification::class,
        'data' => [
            'type' => 'job_application_status_changed',
            'title' => 'Application Status Updated',
            'message' => 'Your application for Frontend Engineer is now reviewing.',
            'url' => '/jobseeker/applications',
        ],
        'read_at' => now(),
    ]);

    $this->actingAs($user)
        ->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.unreadCount', 1)
        ->assertJsonPath('data.pagination.total', 2)
        ->assertJsonCount(2, 'data.items');
});

test('user can mark single notification as read', function () {
    $user = User::factory()->create();
    $id = (string) Str::uuid();

    $user->notifications()->create([
        'id' => $id,
        'type' => JobApplicationStatusChangedNotification::class,
        'data' => [
            'type' => 'job_application_status_changed',
            'title' => 'Application Status Updated',
            'message' => 'Your application is now shortlisted.',
            'url' => '/jobseeker/applications',
        ],
        'read_at' => null,
    ]);

    $this->actingAs($user)
        ->patchJson("/api/v1/notifications/{$id}/read")
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.id', $id);

    expect($user->unreadNotifications()->count())->toBe(0);
});

test('user cannot mark another users notification as read', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $id = (string) Str::uuid();

    $otherUser->notifications()->create([
        'id' => $id,
        'type' => JobApplicationStatusChangedNotification::class,
        'data' => [
            'type' => 'job_application_status_changed',
            'title' => 'Secret update',
            'message' => 'Secret message',
            'url' => '/jobseeker/applications',
        ],
        'read_at' => null,
    ]);

    $this->actingAs($user)
        ->patchJson("/api/v1/notifications/{$id}/read")
        ->assertNotFound();
});

test('user can mark all notifications as read', function () {
    $user = User::factory()->create();

    for ($i = 0; $i < 3; $i++) {
        $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => JobApplicationStatusChangedNotification::class,
            'data' => [
                'type' => 'job_application_status_changed',
                'title' => "Notification {$i}",
                'message' => "Message {$i}",
                'url' => '/jobseeker/applications',
            ],
            'read_at' => null,
        ]);
    }

    expect($user->unreadNotifications()->count())->toBe(3);

    $this->actingAs($user)
        ->postJson('/api/v1/notifications/read-all')
        ->assertOk()
        ->assertJsonPath('success', true);

    expect($user->unreadNotifications()->count())->toBe(0);
});
