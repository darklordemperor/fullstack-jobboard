<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request): Response {
            if (! $request->is('api/*')) {
                return $response;
            }

            if ($response instanceof JsonResponse) {
                $payload = $response->getData(true);
                $message = (string) ($payload['message'] ?? Response::$statusTexts[$response->getStatusCode()] ?? 'Request failed.');
                $errors = $payload['errors'] ?? null;
            } else {
                $message = Response::$statusTexts[$response->getStatusCode()] ?? 'Request failed.';
                $errors = null;
            }

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => $message,
                'errors' => $errors,
            ], $response->getStatusCode(), $response->headers->all());
        });
    })->create();
