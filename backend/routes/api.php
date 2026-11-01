<?php

use App\Http\Controllers\Api\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\Auth\RegisteredUserController;
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
