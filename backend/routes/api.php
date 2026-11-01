<?php

use App\Http\Controllers\Api\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\Auth\RegisteredUserController;
use App\Http\Controllers\Api\EmployerJobListingController;
use App\Http\Controllers\Api\InterviewController;
use App\Http\Controllers\Api\JobApplicationController;
use App\Http\Controllers\Api\JobListingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SavedJobListingController;
use Illuminate\Support\Facades\Route;

Route::prefix('notifications')->middleware('auth:sanctum')->group(function (): void {
    Route::get('/', [NotificationController::class, 'index']);
    Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
});

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:login');
    Route::post('/register', [RegisteredUserController::class, 'store'])
        ->middleware('throttle:register');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthenticatedSessionController::class, 'show']);
        Route::patch('/profile', [AuthenticatedSessionController::class, 'update']);
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    });
});

Route::get('/me', [AuthenticatedSessionController::class, 'show'])
    ->middleware('auth:sanctum');

Route::get('/job-listings', [JobListingController::class, 'index']);
Route::get('/job-listings/{jobListing}', [JobListingController::class, 'show'])
    ->whereNumber('jobListing');
Route::post('/job-listings/{jobListing}/applications', [JobApplicationController::class, 'store'])
    ->middleware('auth:sanctum')
    ->whereNumber('jobListing');
Route::get('/job-applications/{jobApplication}/resume', [JobApplicationController::class, 'resume'])
    ->middleware('auth:sanctum')
    ->whereNumber('jobApplication');

Route::prefix('jobseeker/applications')->middleware('auth:sanctum')->group(function (): void {
    Route::get('/', [JobApplicationController::class, 'jobseekerIndex']);
    Route::patch('/{jobApplication}/withdraw', [JobApplicationController::class, 'withdraw'])
        ->whereNumber('jobApplication');
});

Route::prefix('jobseeker/saved-jobs')->middleware('auth:sanctum')->group(function (): void {
    Route::get('/', [SavedJobListingController::class, 'index']);
    Route::post('/{jobListing}', [SavedJobListingController::class, 'store'])
        ->whereNumber('jobListing');
    Route::delete('/{jobListing}', [SavedJobListingController::class, 'destroy'])
        ->whereNumber('jobListing');
});

Route::prefix('employer/job-listings')->middleware('auth:sanctum')->group(function (): void {
    Route::get('/', [EmployerJobListingController::class, 'index']);
    Route::get('/{jobListing}', [EmployerJobListingController::class, 'show'])->whereNumber('jobListing');
    Route::get('/{jobListing}/applications', [JobApplicationController::class, 'index'])->whereNumber('jobListing');
    Route::post('/', [EmployerJobListingController::class, 'store']);
    Route::put('/{jobListing}', [EmployerJobListingController::class, 'update'])->whereNumber('jobListing');
    Route::post('/{jobListing}/publish', [EmployerJobListingController::class, 'publish'])->whereNumber('jobListing');
    Route::post('/{jobListing}/close', [EmployerJobListingController::class, 'close'])->whereNumber('jobListing');
});

Route::patch('/employer/applications/{jobApplication}/status', [JobApplicationController::class, 'updateStatus'])
    ->middleware('auth:sanctum')
    ->whereNumber('jobApplication');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/employer/applications/{jobApplication}/interviews', [InterviewController::class, 'store'])
        ->whereNumber('jobApplication');
    Route::get('/employer/interviews', [InterviewController::class, 'employerIndex']);
    Route::patch('/employer/interviews/{interview}/reschedule', [InterviewController::class, 'reschedule'])
        ->whereNumber('interview');
    Route::patch('/employer/interviews/{interview}/cancel', [InterviewController::class, 'cancel'])
        ->whereNumber('interview');
    Route::patch('/employer/interviews/{interview}/complete', [InterviewController::class, 'complete'])
        ->whereNumber('interview');

    Route::get('/jobseeker/interviews', [InterviewController::class, 'candidateIndex']);
    Route::patch('/jobseeker/interviews/{interview}/confirm', [InterviewController::class, 'confirm'])
        ->whereNumber('interview');
});
