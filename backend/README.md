# JobBoard Backend API

Laravel backend API for a job board application. This directory contains the API, authentication, database migrations, seeders, Docker setup, and tests. The Next.js frontend now lives in the project-level `frontend/` directory.

## Current Scope

This checkout is the Laravel backend project. It currently includes:

- Laravel 13 API application
- Sanctum session authentication for SPA clients
- Role field on users: `admin`, `employer`, `jobseeker`
- Clean Architecture job-listing lifecycle: draft, published, closed
- Public job search with filtering, sorting, compact payloads, and pagination
- Jobseeker saved/bookmarked job listings persisted per candidate account
- Employer-owned create, update, publish, and close operations
- Candidate application history, controlled withdrawal, and private PDF resume attachments
- Queued employer and candidate application lifecycle notifications
- Employer-owned interview scheduling with candidate confirmation, rescheduling, cancellation, completion, and overlap prevention
- Queued interview invitations and lifecycle notifications
- Admin-only platform analytics with compact metrics, six-month growth, recent activity, and latest-user summaries
- Admin user directory management with role updates, account suspension (`suspended_at`), and `EnsureNotSuspended` middleware
- In-app notification center database channels and endpoints (`GET /notifications`, `PATCH /notifications/{notification}/read`, `POST /notifications/read-all`)
- Search input wildcard escaping (`LikeQuery::escape`) across listings, applications, and admin user directory
- Auth rate limiting with 429 responses (`throttle:login` at 5 attempts/min per email+IP, `throttle:register` at 5 attempts/min per IP)
- Consistent JSON response envelope
- CORS configured for `http://localhost:3000`
- Docker Compose services for Laravel, MySQL, Redis, Mailpit, and the project-level Next.js app
- Pest feature tests for authentication, listings, applications, API envelope behavior, and CORS
- Pest unit and feature tests for admin analytics calculations, authorization, payload privacy, and OpenAPI parity

Frontend routes such as `src/app/(dashboard)/admin/dashboard/page.tsx`, `src/app/(dashboard)/employer/jobs/page.tsx`, and `src/app/(dashboard)/jobseeker/browse/page.tsx` belong in `../frontend`, not in this Laravel `app/` directory.

## Tech Stack

| Area | Technology |
| --- | --- |
| Backend | Laravel 13 |
| PHP | PHP 8.4+ |
| Auth | Laravel Sanctum |
| Roles | `users.role` is the current source of truth |
| Tests | Pest 4 |
| Formatting | Laravel Pint |
| Database | MySQL 8 |
| Cache/Queue | Redis |
| Local mail | Mailpit |
| Containers | Docker Compose |

## Project Structure

```text
app/
  Domain/Auth/
    Entities/User.php
    Enums/UserRole.php
    Repositories/UserRepository.php
    ValueObjects/
  Domain/JobListings/
    Entities/JobListing.php
    Enums/
    Repositories/JobListingRepository.php
    ValueObjects/
  Domain/JobApplications/
    Entities/
    Enums/
    Repositories/
    ValueObjects/
  Domain/Interviews/
    Entities/
    Enums/
    Repositories/
    ValueObjects/
  Application/Auth/
    Contracts/
    DTOs/
    Exceptions/
    UseCases/
  Application/JobListings/
    DTOs/
    Exceptions/
    UseCases/
  Application/JobApplications/
    Contracts/
    DTOs/
    Exceptions/
    UseCases/
  Application/Interviews/
    Contracts/
    DTOs/
    Exceptions/
    UseCases/
  Infrastructure/
    Auth/LaravelAuthSession.php
    Persistence/Eloquent/EloquentUserRepository.php
    Persistence/Eloquent/EloquentJobListingRepository.php
    Persistence/Eloquent/EloquentJobApplicationRepository.php
    Persistence/Eloquent/EloquentInterviewRepository.php
    Files/LaravelResumeStorage.php
    Notifications/LaravelJobApplicationNotifier.php
    Notifications/LaravelInterviewNotifier.php
    Security/LaravelPasswordHasher.php
  Http/
    Controllers/Api/Auth/
      AuthenticatedSessionController.php
      RegisteredUserController.php
    Requests/Api/Auth/
      LoginRequest.php
      RegisterRequest.php
    Resources/
      JobListingResource.php
      JobListingSummaryResource.php
      UserResource.php
  Models/
    JobApplication.php
    JobListing.php
    User.php
  Notifications/
  Support/
    ApiResponse.php
bootstrap/
  app.php
config/
  cors.php
database/
  migrations/
  seeders/
    DatabaseSeeder.php
routes/
  api.php
tests/
  Feature/
    ApiFoundationTest.php
    AuthEndpointsTest.php
    JobListingsApiTest.php
  Unit/
    Architecture/CleanArchitectureTest.php
    Auth/AuthUseCasesTest.php
    JobListingUseCasesTest.php
```

## Clean Architecture Flow

Dependencies point inward. Domain and Application code do not import Laravel, Eloquent, HTTP, or Infrastructure classes.

```text
HTTP controller
  -> Application use case
    -> Domain repository / application port
      <- Infrastructure implementation selected by AppServiceProvider
```

Login follows this concrete flow:

```text
LoginRequest
  -> AuthenticatedSessionController
    -> LoginUser
      -> UserRepository -> EloquentUserRepository -> App\Models\User
      -> PasswordHasher -> LaravelPasswordHasher -> Laravel Hash
      -> AuthSession -> LaravelAuthSession -> Laravel Auth + Session
    -> UserResource
```

Public job search follows the same boundary direction:

```text
SearchJobListingsRequest
  -> JobListingController
    -> SearchJobListings
      -> JobListingRepository
        -> EloquentJobListingRepository -> App\Models\JobListing -> MySQL
    -> JobListingSummaryResource
```

`AppServiceProvider` is the backend composition root. Replace an infrastructure implementation there without changing a use case or domain entity.

## API Base URL

The API prefix is configured in `bootstrap/app.php`:

```text
/api/v1
```

Local Docker URL:

```text
http://localhost:8000/api/v1
```

## Authentication Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Register a new user and start a session |
| POST | `/api/v1/auth/login` | Log in and regenerate the session |
| GET | `/api/v1/auth/me` | Return the authenticated user |
| PATCH | `/api/v1/auth/profile` | Update the authenticated user's name, email, and optional password |
| POST | `/api/v1/auth/logout` | Log out and invalidate the session |
| GET | `/api/v1/me` | Backward-compatible alias using the same use case and resource |

For browser-based SPA authentication, request the Sanctum CSRF cookie first:

```text
GET /sanctum/csrf-cookie
```

Then send credentials to `/api/v1/auth/login` with cookies enabled from the Next.js frontend origin.

## Administration Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/admin/dashboard` | Admin | Return compact platform metrics, user distribution, six UTC growth buckets, recent activity, and latest users |
| GET | `/api/v1/admin/users` | Admin | Paginate and filter the platform user directory by `search`, `role`, `status`, `page`, and `perPage` |

The analytics response excludes passwords, tokens, database internals, and full model payloads. Counts and trends are calculated server-side; a `null` `changePercent` means the current comparison period has data while the previous period was zero. Latest-user status is limited to `verified` or `unverified`, matching the current database capability.

## Job Listing Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/job-listings` | Public | Search published listings (supports `savedOnly=true` for authenticated jobseekers) |
| GET | `/api/v1/job-listings/{id}` | Public | Get one published listing |
| GET | `/api/v1/jobseeker/saved-jobs` | Jobseeker | List the signed-in candidate's saved job listing IDs |
| POST | `/api/v1/jobseeker/saved-jobs/{id}` | Jobseeker | Bookmark a published job listing |
| DELETE | `/api/v1/jobseeker/saved-jobs/{id}` | Jobseeker | Remove a bookmarked job listing |
| GET | `/api/v1/employer/job-listings` | Employer | List the signed-in employer's listings with keyword search (`search`), applicant/shortlisted counts, and status counts |
| GET | `/api/v1/employer/job-listings/{id}` | Owner employer | Get one owned listing for editing |
| POST | `/api/v1/employer/job-listings` | Employer | Create a draft listing |
| PUT | `/api/v1/employer/job-listings/{id}` | Owner employer | Update an open listing |
| POST | `/api/v1/employer/job-listings/{id}/publish` | Owner employer | Publish a draft listing |
| POST | `/api/v1/employer/job-listings/{id}/close` | Owner employer | Close a listing |
| POST | `/api/v1/job-listings/{id}/applications` | Jobseeker | Apply once to a published listing |
| GET | `/api/v1/jobseeker/applications` | Jobseeker | List the signed-in candidate's application history and counts (supports `search` and `jobListingId`) |
| PATCH | `/api/v1/jobseeker/applications/{id}/withdraw` | Applicant | Withdraw an active application |
| GET | `/api/v1/employer/job-listings/{id}/applications` | Owner employer | Review paginated applications, keyword search (`search`), and status counts |
| PATCH | `/api/v1/employer/applications/{id}/status` | Owner employer | Move an application through the hiring lifecycle |
| GET | `/api/v1/job-applications/{id}/resume` | Applicant or owner employer | Download an attached private resume |
| POST | `/api/v1/employer/applications/{id}/interviews` | Owner employer | Schedule a shortlisted candidate |
| GET | `/api/v1/employer/interviews` | Employer | List the signed-in employer's interviews with unfiltered status counts |
| PATCH | `/api/v1/employer/interviews/{id}/reschedule` | Owner employer | Replace the schedule and require confirmation again |
| PATCH | `/api/v1/employer/interviews/{id}/cancel` | Owner employer | Cancel an active interview |
| PATCH | `/api/v1/employer/interviews/{id}/complete` | Owner employer | Complete a confirmed interview after its end time |
| GET | `/api/v1/jobseeker/interviews` | Jobseeker | List the signed-in candidate's interviews with unfiltered status counts |
| PATCH | `/api/v1/jobseeker/interviews/{id}/confirm` | Candidate | Confirm a scheduled interview |

Search query parameters are `keyword`, `location`, `employmentTypes[]`, `salaryCap`, `category`, `sort`, `page`, and `perPage`. `sort` accepts `newest` or `salary_desc`; `perPage` is capped at 50.

The employer collection accepts optional `status` (`draft`, `published`, or `closed`), `search` (matches title, location, or category), `page`, and `perPage` query parameters. Its compact payload contains `items`, `pagination`, and unfiltered `counts` for the employer's total, draft, published, and closed listings.

Create and update payload:

```json
{
  "title": "Senior Backend Engineer",
  "description": "Build reliable payment services and mentor the engineering team.",
  "location": "Remote",
  "employmentType": "remote",
  "category": "IT",
  "salaryMinimum": 90000,
  "salaryMaximum": 150000
}
```

List responses intentionally omit `description`, `employerId`, and internal status fields. Detail and employer mutation responses return the full documented resource.

Application submission is `multipart/form-data`:

```text
coverLetter: I have five years of experience building reliable backend services and working with product teams.
resume: candidate-resume.pdf (optional, PDF only, maximum 5 MB)
```

The cover letter must contain 50–5,000 characters. Resume bytes are stored on Laravel's private local disk; API payloads expose only availability, original name, and size. A jobseeker can apply only once to a published listing. Candidate and employer application queries accept `status`, `page`, and `perPage`; `status` accepts `submitted`, `reviewing`, `shortlisted`, `rejected`, `hired`, or `withdrawn`. Employers cannot set `withdrawn` directly.

Status updates use:

```json
{
  "status": "reviewing"
}
```

Employer transitions are `submitted → reviewing|shortlisted|rejected`, `reviewing → shortlisted|rejected`, and `shortlisted → hired|rejected`. Candidates can withdraw from `submitted`, `reviewing`, or `shortlisted`. `hired`, `rejected`, and `withdrawn` are terminal.

Submitting and withdrawing notify the listing's employer. Employer status changes notify the candidate. These notifications implement Laravel's queued notification contract and are processed by the `queue-worker` Compose service.

## Interview Scheduling Contract

Only a shortlisted application can be scheduled. Schedule and reschedule requests use an ISO 8601 instant plus the candidate-facing IANA timezone:

```json
{
  "scheduledAt": "2026-11-02T03:00:00.000Z",
  "durationMinutes": 60,
  "timezone": "Asia/Bangkok",
  "location": "https://meet.example/interview",
  "notes": "Prepare to discuss one recent system design."
}
```

`durationMinutes` accepts 15–480, `location` is limited to 255 characters, and `notes` is optional with a 2,000-character limit. Listing endpoints accept `status`, `page`, and `perPage`; status is `scheduled`, `confirmed`, `cancelled`, or `completed`. Their payload includes `items`, `pagination`, and unfiltered `counts` (`total`, `scheduled`, `confirmed`, `cancelled`, `completed`) for the signed-in participant.

The response is an explicit resource rather than an Eloquent model. It contains `jobApplicationId`, compact job/employer/candidate objects, UTC `scheduledAt` and `endsAt`, the original IANA `timezone`, location, notes, status, lifecycle timestamps, and audit timestamps. Passwords, model internals, and tokens are never returned.

Employer and candidate active schedules are protected with half-open overlap rules: an existing interval conflicts when `existingStart < requestedEnd` and `existingEnd > requestedStart`. Back-to-back interviews are allowed. Participant rows are locked in a stable order when the interview is created to close the concurrent scheduling race. MySQL cannot express this cross-row time-range rule as a normal constraint, so the application and repository enforce it transactionally.

Lifecycle rules are `scheduled → confirmed → completed`, while `scheduled` and `confirmed` can be cancelled. Rescheduling an active interview returns it to `scheduled` so the candidate must confirm the new time. Completing before the scheduled end is rejected. Every state-changing endpoint is owner/participant scoped and queues the relevant mail notification.

## OpenAPI Contract

The dependency-free OpenAPI 3.1 contract is available while the API is running:

```text
GET http://localhost:8000/api/v1/openapi.json
```

The document covers authentication, admin analytics, job listings, applications, private resume downloads, interviews, request validation, response resources, pagination, lifecycle enums, and Sanctum session/CSRF security. `OpenApiContractTest` verifies that every Laravel API route is documented and that public resource fields and domain enum values stay synchronized.

The repository does not include an interactive Swagger UI package. Adding one remains optional because the OpenAPI JSON can already be imported into Swagger Editor, Postman, Insomnia, or a client generator without adding a production dependency.

## Response Format

Successful responses use:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful.",
  "errors": null
}
```

API exceptions are normalized to:

```json
{
  "success": false,
  "data": null,
  "message": "Request failed.",
  "errors": null
}
```

## Auth Payloads

Register:

```json
{
  "name": "Jane Candidate",
  "email": "jane@example.com",
  "password": "password",
  "password_confirmation": "password",
  "role": "jobseeker"
}
```

Allowed registration roles are:

- `employer`
- `jobseeker`

Login:

```json
{
  "email": "admin@jobboard.com",
  "password": "password"
}
```

User API resources return:

```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@jobboard.com",
  "role": "admin",
  "createdAt": "2026-05-20T00:00:00.000000Z"
}
```

## Demo Accounts

After `php artisan migrate:fresh --seed`, the seeder creates:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@jobboard.com` | `password` |
| Employer | `employer@jobboard.com` | `password` |
| Jobseeker | `seeker@jobboard.com` | `password` |

The seeder also creates 12 published job listings owned by the employer demo account.

The old `test@example.com` and `jane@example.com` seed users are not part of the current seeder.

## Local Setup

### With Docker

```bash
docker compose up -d
docker compose exec laravel-api php artisan key:generate
docker compose exec laravel-api php artisan migrate:fresh --seed
```

Services from `docker-compose.yml`:

| Service | URL / Port |
| --- | --- |
| Laravel API | `http://localhost:8000` |
| Queue worker | Background process; no host port |
| Next.js app | `http://localhost:3000` |
| MySQL | `localhost:3306` |
| Redis | `localhost:6379` |
| Mailpit UI | `http://localhost:8025` |

The `nextjs-app` Docker service is configured at the project root and builds from `./frontend`. Keep React/Next.js files in that directory.

### Without Docker

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

If you also need frontend assets for Laravel Vite:

```bash
npm install
npm run dev
```

## Testing

Run the test suite:

```bash
php artisan test --compact
```

Run the backend suite in an isolated Docker test container:

```bash
docker compose --profile test run --rm backend-test
```

The `backend-test` profile loads `backend/.env.testing` before Laravel boots and uses in-memory SQLite. Do not run `php artisan test` inside the long-running `laravel-api` service because its development MySQL environment is already inherited by that process.

Run a focused auth test:

```bash
php artisan test --compact --filter=AuthEndpointsTest
```

Current tests cover:

- Login with Sanctum session credentials
- Invalid login validation response
- Registration and logout
- Protected API JSON envelope when unauthenticated
- CORS credentials for `http://localhost:3000`
- Public job search, detail visibility, filters, compact response shape, and pagination
- Employer owner-scoped list/detail, status counts, create, update, publish, close, role, and salary validation
- Job listing domain lifecycle and use cases
- Jobseeker application submission, duplicate prevention, employer ownership, applicant filtering/counts, and status transitions
- Candidate history, withdrawal authorization/lifecycle, private resume validation/download, and notification dispatch
- Interview role/ownership boundaries, validation, compact response contract, overlap handling, lifecycle transitions, pagination, and queued notification dispatch
- Admin authorization, aggregate calculations, compact response shape, sensitive-field exclusion, and six-month growth buckets

Tests use the committed, non-secret `.env.testing` file and the in-memory SQLite connection configured in `phpunit.xml`; they do not require a developer `.env` or silently skip when MySQL is unavailable. Architecture tests enforce the inward dependency rule.

## Frontend Integration Notes

The Next.js app should call this API with credentials enabled.

Expected role redirects in the frontend login page:

```ts
nextUrl ?? (
  user.role === "admin" ? "/admin/dashboard" :
  user.role === "employer" ? "/employer/jobs" :
  "/jobseeker/browse"
)
```

Suggested frontend page locations:

```text
..\frontend\src\app\(dashboard)\admin\dashboard\page.tsx
..\frontend\src\app\(dashboard)\employer\jobs\page.tsx
..\frontend\src\app\(dashboard)\jobseeker\browse\page.tsx
```

## Current Limitations

This backend currently implements authentication, account profile and password updates, admin dashboard analytics, paginated admin user directory search and management (role changes and account suspension), in-app notifications, the job-listing lifecycle, jobseeker saved jobs, candidate application history with keyword search, optional private PDF resumes, controlled withdrawals, employer listing and applicant review with keyword search, interview scheduling with status summaries, and queued lifecycle notifications. Destructive account deletion and external OAuth providers are not implemented yet.
