# JobBoard Backend API

Laravel backend API for a job board application. This directory contains the API, authentication, database migrations, seeders, Docker setup, and tests. The Next.js frontend now lives in the project-level `frontend/` directory.

## Current Scope

This checkout is the Laravel backend project. It currently includes:

- Laravel 13 API application
- Sanctum session authentication for SPA clients
- Role field on users: `admin`, `employer`, `jobseeker`
- Consistent JSON response envelope
- CORS configured for `http://localhost:3000`
- Docker Compose services for Laravel, MySQL, Redis, Mailpit, and the project-level Next.js app
- Pest feature tests for authentication, API envelope behavior, and CORS

Frontend routes such as `src/app/(dashboard)/admin/dashboard/page.tsx`, `src/app/(dashboard)/employer/jobs/page.tsx`, and `src/app/(dashboard)/jobseeker/browse/page.tsx` belong in `../frontend`, not in this Laravel `app/` directory.

## Tech Stack

| Area | Technology |
| --- | --- |
| Backend | Laravel 13 |
| PHP | PHP 8.3+ |
| Auth | Laravel Sanctum |
| Roles | User `role` column plus Spatie Permission package installed |
| Tests | Pest 4 |
| Formatting | Laravel Pint |
| Database | MySQL 8 |
| Cache/Queue | Redis |
| Local mail | Mailpit |
| Containers | Docker Compose |

## Project Structure

```text
app/
  Http/
    Controllers/Api/Auth/
      AuthenticatedSessionController.php
      RegisteredUserController.php
    Requests/Api/Auth/
      LoginRequest.php
      RegisterRequest.php
    Resources/
      UserResource.php
  Models/
    User.php
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
```

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
| POST | `/api/v1/auth/logout` | Log out and invalidate the session |
| GET | `/api/v1/me` | Alternate protected current-user endpoint |

For browser-based SPA authentication, request the Sanctum CSRF cookie first:

```text
GET /sanctum/csrf-cookie
```

Then send credentials to `/api/v1/auth/login` with cookies enabled from the Next.js frontend origin.

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

The existing auth tests expect a MySQL database named `dashboard_api` on `127.0.0.1:3306` with username `dashboard_api` and password `secret`.

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

This backend currently has auth and foundation API pieces in place. Job posting, application upload, employer applicant management, and admin management endpoints are not implemented in this repository yet. Treat any frontend dashboard pages as mock UI until those API endpoints are added.
