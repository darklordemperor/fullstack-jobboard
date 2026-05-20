<div align="center">

# 🧑‍💼 JobBoard — Full Stack Job Platform

[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

**A production-ready full-stack job board application built to demonstrate professional API design, SPA authentication, and modern frontend architecture.**

[Features](#-features) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Docs](#-api-documentation) • [Screenshots](#-screenshots)

</div>

---

## 📌 Project Overview

JobBoard is a full-stack application where **Employers** can post job listings and **Job Seekers** can browse and apply. It is built to showcase real-world backend and frontend skills including REST API design, SPA cookie authentication, role-based access control, file uploads, queued email notifications, and Docker-based local development.

> **Purpose:** This project serves as a portfolio demonstration of my skills in Laravel 13 backend API development and Next.js 15 frontend development — covering authentication, authorization, clean architecture, and developer tooling.

---

## ✨ Features

### 👤 Authentication & Authorization

- [x] Cookie-based SPA authentication via Laravel Sanctum
- [x] Role-based access control (Admin / Employer / Job Seeker)
- [x] Protected routes on both frontend and backend
- [x] CSRF protection for all state-changing requests

### 🏢 Employer Features

- [x] Create, edit, and delete job listings
- [x] View all applicants per job
- [x] Download applicant resumes (signed URLs)
- [x] Email notification when someone applies (queued)

### 🔍 Job Seeker Features

- [x] Browse and filter jobs (category, location, type)
- [x] Apply to jobs with resume upload (PDF, max 2MB)
- [x] View application history and status
- [x] One application per job enforcement

### 🛠️ Admin Features

- [x] Manage all users and listings
- [x] Dashboard with stats (jobs, applications, users)

### ⚙️ Technical Highlights

- [x] Consistent JSON response structure across all endpoints
- [x] Global exception handling (401, 403, 422, 500)
- [x] Redis caching for job listings
- [x] Queue worker for email notifications (Mailpit in dev)
- [x] Swagger/OpenAPI documentation
- [x] Docker Compose for one-command local setup

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Network                        │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │   Next.js 15     │◄──────► │     Laravel 13 API       │  │
│  │   :3000          │  HTTP   │     :8000                │  │
│  │                  │  + SPA  │                          │  │
│  │  App Router      │  Cookie │  REST API /api/v1/       │  │
│  │  TypeScript      │  Auth   │  Sanctum SPA Auth        │  │
│  │  Zustand         │         │  Spatie Permissions      │  │
│  │  Axios           │         │  Service + Repository    │  │
│  └──────────────────┘         └──────────┬───────────────┘  │
│                                          │                  │
│                          ┌───────────────┼────────────┐     │
│                          │               │            │     │
│                    ┌─────▼─────┐  ┌──────▼────┐ ┌────▼───┐ │
│                    │  MySQL 8  │  │  Redis 7  │ │Mailpit │ │
│                    │  :3306    │  │  :6379    │ │ :8025  │ │
│                    └───────────┘  └───────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend — Laravel 13

| Technology                | Purpose                                |
| ------------------------- | -------------------------------------- |
| Laravel 13                | PHP framework, routing, ORM            |
| PHP 8.3                   | Language with modern attributes syntax |
| Laravel Sanctum           | SPA cookie-based authentication        |
| Spatie Laravel Permission | Role & permission management           |
| Laravel Queues + Redis    | Async email & notification processing  |
| MySQL 8                   | Primary relational database            |
| Laravel Cache + Redis     | Response caching layer                 |
| Mailpit                   | Local email testing (dev only)         |

### Frontend — Next.js 15

| Technology            | Purpose                             |
| --------------------- | ----------------------------------- |
| Next.js 15            | React framework with App Router     |
| TypeScript 5          | Type-safe development               |
| Tailwind CSS          | Utility-first styling               |
| Axios                 | HTTP client with interceptors       |
| Zustand               | Lightweight global state management |
| React Hook Form + Zod | Form handling and validation        |

### DevOps

| Technology              | Purpose                         |
| ----------------------- | ------------------------------- |
| Docker + Docker Compose | Containerized local environment |
| Nginx                   | Reverse proxy for Laravel       |
| Redis                   | Cache + Queue driver            |

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/jobboard.git
cd jobboard
```

### 2. Setup Environment Files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Start All Services

```bash
docker compose up -d
```

This starts: Laravel API, Next.js, MySQL, Redis, Mailpit — all with one command.

### 4. Setup Laravel

```bash
# Run migrations and seed demo data
docker compose exec laravel php artisan migrate --seed

# Generate app key
docker compose exec laravel php artisan key:generate
```

### 5. Access the Apps

| Service               | URL                                     |
| --------------------- | --------------------------------------- |
| 🌐 Frontend (Next.js) | http://localhost:3000                   |
| 🔧 Backend API        | http://localhost:8000                   |
| 📧 Mailpit (emails)   | http://localhost:8025                   |
| 📖 Swagger API Docs   | http://localhost:8000/api/documentation |

### Demo Accounts (after seeding)

| Role       | Email                 | Password |
| ---------- | --------------------- | -------- |
| Admin      | admin@jobboard.com    | password |
| Employer   | employer@jobboard.com | password |
| Job Seeker | seeker@jobboard.com   | password |

---

## 📡 API Documentation

All endpoints are documented via Swagger UI at `/api/documentation`.

### Base URL

```
http://localhost:8000/api/v1
```

### Response Format (consistent across all endpoints)

```json
{
    "success": true,
    "data": {},
    "message": "Operation successful",
    "errors": null
}
```

### Auth Endpoints

```
GET  /sanctum/csrf-cookie     → Get CSRF token (call before login)
POST /api/v1/auth/register    → Register new user
POST /api/v1/auth/login       → Login (sets session cookie)
GET  /api/v1/auth/me          → Get authenticated user
POST /api/v1/auth/logout      → Logout (clears session)
```

### Job Endpoints

```
GET    /api/v1/jobs           → List jobs (paginated, filterable)
GET    /api/v1/jobs/{id}      → Get single job
POST   /api/v1/jobs           → Create job (Employer only)
PUT    /api/v1/jobs/{id}      → Update job (Owner only)
DELETE /api/v1/jobs/{id}      → Delete job (Owner only)
```

### Application Endpoints

```
POST /api/v1/jobs/{id}/apply  → Apply with resume (Job Seeker)
GET  /api/v1/applications     → My applications (Job Seeker)
GET  /api/v1/jobs/{id}/applicants → View applicants (Employer)
```

---

## 🗂️ Project Structure

### Backend (Laravel 13)

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/   ← API Controllers
│   │   ├── Requests/             ← Form Request validation
│   │   └── Resources/            ← API Resources (DTOs)
│   ├── Models/                   ← Eloquent Models
│   ├── Services/                 ← Business logic layer
│   ├── Repositories/             ← Data access layer
│   ├── Events/                   ← Domain events
│   └── Listeners/                ← Event listeners (queued)
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/api.php
└── docker/
    ├── nginx/
    └── php/
```

### Frontend (Next.js 15)

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/
│       ├── employer/jobs/page.tsx
│       └── jobseeker/browse/page.tsx
├── lib/
│   ├── axios.ts              ← Configured Axios instance
│   └── auth.ts               ← Auth helper functions
├── store/
│   └── authStore.ts          ← Zustand global state
├── types/
│   └── api.types.ts          ← TypeScript API types
└── middleware.ts             ← Route protection
```

---

## 🔐 Authentication Flow

```
Next.js                        Laravel
  │                               │
  │── GET /sanctum/csrf-cookie ──►│ Set XSRF-TOKEN cookie
  │                               │
  │── POST /api/v1/auth/login ───►│ Validate credentials
  │   (with XSRF-TOKEN header)    │ Set session cookie
  │◄──────── 200 OK ──────────────│
  │                               │
  │── GET /api/v1/auth/me ───────►│ Read session cookie
  │◄──────── User data ───────────│
  │                               │
  │  Store user in Zustand        │
  │  Redirect to /dashboard       │
```

---

## 📬 Contact

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [yourlinkedin](https://linkedin.com/in/yourlinkedin)
- Email: your@email.com

---

<div align="center">

**If you found this project useful, please consider giving it a ⭐**

</div>
