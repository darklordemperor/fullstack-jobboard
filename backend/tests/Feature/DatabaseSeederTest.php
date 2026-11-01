<?php

use App\Models\JobListing;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

test('database seeding is idempotent across container restarts', function () {
    $this->seed(DatabaseSeeder::class);

    $initialUserIds = User::query()
        ->whereIn('email', [
            'admin@jobboard.com',
            'employer@jobboard.com',
            'seeker@jobboard.com',
        ])
        ->orderBy('email')
        ->pluck('id')
        ->all();

    $this->seed(DatabaseSeeder::class);

    expect(User::query()->count())->toBe(3)
        ->and(JobListing::query()->count())->toBe(12)
        ->and(User::query()
            ->whereIn('email', [
                'admin@jobboard.com',
                'employer@jobboard.com',
                'seeker@jobboard.com',
            ])
            ->orderBy('email')
            ->pluck('id')
            ->all())
        ->toBe($initialUserIds);
});
