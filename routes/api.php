<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/me', function (Request $request) {
    return response()->json([
        'success' => true,
        'data' => [
            'user' => $request->user(),
        ],
        'message' => 'Authenticated user retrieved.',
        'errors' => null,
    ]);
})->middleware('auth:sanctum');
