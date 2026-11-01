<?php

use App\Http\Controllers\Api\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\Auth\RegisteredUserController;
use App\Http\Controllers\Api\EmployerJobListingController;
use App\Http\Controllers\Api\JobListingController;
use Illuminate\Support\Facades\Route;

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

Route::prefix('employer/job-listings')->middleware('auth:sanctum')->group(function (): void {
    Route::get('/', [EmployerJobListingController::class, 'index']);
    Route::get('/{jobListing}', [EmployerJobListingController::class, 'show'])->whereNumber('jobListing');
    Route::post('/', [EmployerJobListingController::class, 'store']);
    Route::put('/{jobListing}', [EmployerJobListingController::class, 'update'])->whereNumber('jobListing');
    Route::post('/{jobListing}/publish', [EmployerJobListingController::class, 'publish'])->whereNumber('jobListing');
    Route::post('/{jobListing}/close', [EmployerJobListingController::class, 'close'])->whereNumber('jobListing');
});
