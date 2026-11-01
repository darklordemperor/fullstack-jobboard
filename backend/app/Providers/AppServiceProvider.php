<?php

namespace App\Providers;

use App\Application\Auth\Contracts\AuthSession;
use App\Application\Auth\Contracts\PasswordHasher;
use App\Domain\Auth\Repositories\UserRepository;
use App\Domain\JobListings\Repositories\JobListingRepository;
use App\Infrastructure\Auth\LaravelAuthSession;
use App\Infrastructure\Persistence\Eloquent\EloquentJobListingRepository;
use App\Infrastructure\Persistence\Eloquent\EloquentUserRepository;
use App\Infrastructure\Security\LaravelPasswordHasher;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepository::class, EloquentUserRepository::class);
        $this->app->bind(JobListingRepository::class, EloquentJobListingRepository::class);
        $this->app->bind(PasswordHasher::class, LaravelPasswordHasher::class);
        $this->app->scoped(AuthSession::class, LaravelAuthSession::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->input('email');

            return Limit::perMinute(5)->by($email.'|'.$request->ip());
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)->by((string) $request->ip());
        });
    }
}
