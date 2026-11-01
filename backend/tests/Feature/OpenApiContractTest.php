<?php

use App\Domain\Admin\Enums\AdminActivityType;
use App\Domain\Admin\Enums\AdminUserStatus;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Interviews\Enums\InterviewStatus;
use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Domain\JobListings\Enums\EmploymentType;
use App\Domain\JobListings\Enums\JobListingStatus;
use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Requests\Api\Auth\RegisterRequest;
use App\Http\Requests\Api\Interviews\StoreInterviewRequest;
use App\Http\Requests\Api\JobApplications\StoreJobApplicationRequest;
use App\Http\Requests\Api\JobApplications\UpdateJobApplicationStatusRequest;
use App\Http\Requests\Api\JobListings\StoreJobListingRequest;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;

test('the OpenAPI document is valid JSON and covers every API route', function () {
    $response = $this->get('/api/v1/openapi.json')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/vnd.oai.openapi+json');

    /** @var array<string, mixed> $document */
    $document = $response->json();

    expect($document)
        ->toHaveKey('openapi', '3.1.0')
        ->toHaveKey('info.title', 'JobBoard API')
        ->toHaveKey('servers.0.url', '/api/v1');

    $operationIds = [];

    collect(RouteFacade::getRoutes()->getRoutes())
        ->filter(fn (Route $route): bool => str_starts_with($route->uri(), 'api/v1'))
        ->each(function (Route $route) use ($document, &$operationIds): void {
            $path = substr($route->uri(), strlen('api/v1')) ?: '/';

            foreach (array_diff($route->methods(), ['HEAD']) as $method) {
                $operation = $document['paths'][$path][strtolower($method)] ?? null;

                expect($operation)
                    ->not->toBeNull("{$method} {$route->uri()} is missing from the OpenAPI document.");

                expect($operation)->toHaveKeys(['operationId', 'responses']);
                $operationIds[] = $operation['operationId'];
            }
        });

    expect(array_unique($operationIds))->toHaveCount(count($operationIds));

    array_walk_recursive($document, function (mixed $value, string|int $key) use ($document): void {
        if ($key !== '$ref' || ! is_string($value) || ! str_starts_with($value, '#/')) {
            return;
        }

        $resolved = $document;

        foreach (explode('/', substr($value, 2)) as $segment) {
            $resolved = is_array($resolved) ? ($resolved[$segment] ?? null) : null;
        }

        expect($resolved)->not->toBeNull("OpenAPI reference {$value} does not resolve.");
    });
});

test('the OpenAPI resource schemas and domain enums match the public API contract', function () {
    /** @var array<string, mixed> $document */
    $document = $this->getJson('/api/v1/openapi.json')->assertOk()->json();
    $schemas = $document['components']['schemas'];

    expect(array_keys($schemas['User']['properties']))->toBe([
        'id', 'name', 'email', 'role', 'createdAt',
    ])->and(array_keys($schemas['JobListing']['properties']))->toBe([
        'id', 'employerId', 'employerName', 'title', 'description', 'location',
        'employmentType', 'category', 'salary', 'status', 'publishedAt', 'createdAt', 'updatedAt',
    ])->and(array_keys($schemas['JobApplication']['properties']))->toBe([
        'id', 'jobListing', 'applicant', 'coverLetter', 'resume', 'status',
        'statusChangedAt', 'withdrawnAt', 'appliedAt', 'updatedAt',
    ])->and(array_keys($schemas['Interview']['properties']))->toBe([
        'id', 'jobApplicationId', 'jobListing', 'employer', 'candidate', 'scheduledAt',
        'endsAt', 'durationMinutes', 'timezone', 'location', 'notes', 'status',
        'confirmedAt', 'cancelledAt', 'completedAt', 'createdAt', 'updatedAt',
    ])->and($schemas['UserRole']['enum'])->toBe(array_column(UserRole::cases(), 'value'))
        ->and($schemas['AdminActivityType']['enum'])->toBe(array_column(AdminActivityType::cases(), 'value'))
        ->and($schemas['AdminUserStatus']['enum'])->toBe(array_column(AdminUserStatus::cases(), 'value'))
        ->and($schemas['EmploymentType']['enum'])->toBe(array_column(EmploymentType::cases(), 'value'))
        ->and($schemas['JobListingStatus']['enum'])->toBe(array_column(JobListingStatus::cases(), 'value'))
        ->and($schemas['JobApplicationStatus']['enum'])->toBe(array_column(JobApplicationStatus::cases(), 'value'))
        ->and($schemas['EmployerManagedJobApplicationStatus']['enum'])->toBe(array_column(JobApplicationStatus::employerManagedCases(), 'value'))
        ->and($schemas['InterviewStatus']['enum'])->toBe(array_column(InterviewStatus::cases(), 'value'));
});

test('protected operations document Sanctum session authentication', function () {
    /** @var array<string, mixed> $document */
    $document = $this->getJson('/api/v1/openapi.json')->assertOk()->json();

    expect($document['paths']['/job-listings']['get']['security'])->toBe([])
        ->and($document['paths']['/auth/login']['post']['security'])->toBe([])
        ->and($document['paths']['/auth/me']['get']['security'])->toBe([
            ['sanctumSession' => []],
        ])->and($document['paths']['/employer/job-listings']['post']['security'])->toBe([
            ['sanctumSession' => [], 'xsrfToken' => []],
        ]);
});

test('documented required request fields match Laravel validation rules', function () {
    /** @var array<string, mixed> $document */
    $document = $this->getJson('/api/v1/openapi.json')->assertOk()->json();

    $requests = [
        'LoginRequest' => LoginRequest::class,
        'RegisterRequest' => RegisterRequest::class,
        'JobListingWriteRequest' => StoreJobListingRequest::class,
        'JobApplicationWriteRequest' => StoreJobApplicationRequest::class,
        'JobApplicationStatusRequest' => UpdateJobApplicationStatusRequest::class,
        'InterviewWriteRequest' => StoreInterviewRequest::class,
    ];

    foreach ($requests as $schema => $requestClass) {
        $request = new $requestClass;
        $required = collect($request->rules())
            ->flatMap(function (array $fieldRules, string $field): array {
                if (! in_array('required', $fieldRules, true)) {
                    return [];
                }

                return in_array('confirmed', $fieldRules, true)
                    ? [$field, "{$field}_confirmation"]
                    : [$field];
            })
            ->values()
            ->all();

        expect($document['components']['schemas'][$schema]['required'])
            ->toBe($required, "{$schema} required fields differ from {$requestClass}.");
    }
});
