# Project Agent Notes

This repository is a full-stack job board project.

## Structure

- `backend/` contains the Laravel API.
- `frontend/` contains the Next.js app.
- `docker-compose.yml` at the project root starts Laravel, Next.js, MySQL, Redis, and Mailpit.

## Backend Work

When working in `backend/`, follow `backend/AGENTS.md` and the Laravel project conventions there.

Important backend defaults:

- API base URL: `http://localhost:8000/api/v1`
- Frontend origin: `http://localhost:3000`
- Sanctum stateful SPA auth is used for browser sessions.
- Run PHP formatting from `backend/` with `vendor/bin/pint --dirty --format agent` after changing PHP files.

## Frontend Work

When working in `frontend/`, follow `frontend/AGENTS.md`.

Important frontend defaults:

- Dev URL: `http://localhost:3000`
- Docker internal API URL: `http://laravel-api:80`
- Browser-facing API URL should target the Laravel API at `http://localhost:8000`.

## Documentation

- Keep root docs focused on the combined project.
- Keep backend API details in `backend/README.md`.
- Keep frontend UI and Next.js notes in `frontend/README.md`.
