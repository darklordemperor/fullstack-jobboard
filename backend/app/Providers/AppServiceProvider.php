<?php

namespace App\Providers;

use App\Application\Auth\Contracts\AuthSession;
use App\Application\Auth\Contracts\PasswordHasher;
use App\Application\Interviews\Contracts\InterviewNotifier;
use App\Application\JobApplications\Contracts\JobApplicationNotifier;
use App\Application\JobApplications\Contracts\ResumeStorage;
use App\Domain\Admin\Repositories\AdminDashboardRepository;
use App\Domain\Auth\Repositories\UserRepository;
use App\Domain\Interviews\Repositories\InterviewRepository;
use App\Domain\JobApplications\Repositories\JobApplicationRepository;
use App\Domain\JobListings\Repositories\JobListingRepository;
use App\Domain\JobListings\Repositories\SavedJobListingRepository;
use App\Infrastructure\Auth\LaravelAuthSession;
use App\Infrastructure\Notifications\LaravelInterviewNotifier;
use App\Infrastructure\Notifications\LaravelJobApplicationNotifier;
use App\Infrastructure\Persistence\Eloquent\EloquentAdminDashboardRepository;
use App\Infrastructure\Persistence\Eloquent\EloquentInterviewRepository;
use App\Infrastructure\Persistence\Eloquent\EloquentJobApplicationRepository;
use App\Infrastructure\Persistence\Eloquent\EloquentJobListingRepository;
use App\Infrastructure\Persistence\Eloquent\EloquentSavedJobListingRepository;
use App\Infrastructure\Persistence\Eloquent\EloquentUserRepository;
use App\Infrastructure\Security\LaravelPasswordHasher;
use App\Infrastructure\Storage\LaravelResumeStorage;
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
        $this->app->bind(AdminDashboardRepository::class, EloquentAdminDashboardRepository::class);
        $this->app->bind(UserRepository::class, EloquentUserRepository::class);
        $this->app->bind(JobApplicationRepository::class, EloquentJobApplicationRepository::class);
        $this->app->bind(JobListingRepository::class, EloquentJobListingRepository::class);
        $this->app->bind(SavedJobListingRepository::class, EloquentSavedJobListingRepository::class);
        $this->app->bind(InterviewRepository::class, EloquentInterviewRepository::class);
        $this->app->bind(PasswordHasher::class, LaravelPasswordHasher::class);
        $this->app->bind(ResumeStorage::class, LaravelResumeStorage::class);
        $this->app->bind(JobApplicationNotifier::class, LaravelJobApplicationNotifier::class);
        $this->app->bind(InterviewNotifier::class, LaravelInterviewNotifier::class);
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
