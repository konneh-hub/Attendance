# Student Attendance Tracking System

A full-stack **Student Attendance Tracking System** built with **Next.js and TypeScript**.

The system is designed for colleges and universities. Administrators manage academic records and users, lecturers manage courses and attendance sessions, and students view and submit attendance. The application is planned as a single Next.js full-stack application with Prisma and PostgreSQL.

> **Project status:** This repository currently contains the initial Next.js App Router scaffold. The database, authentication, role-based dashboards, APIs, and attendance workflows described below are the target architecture for the application and will be implemented incrementally.

## Table of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Application Routes](#application-routes)
- [API Architecture](#api-architecture)
- [Authentication and Authorization](#authentication-and-authorization)
- [Database Architecture](#database-architecture)
- [Attendance System](#attendance-system)
- [Verification Methods](#verification-methods)
- [Reports and Statistics](#reports-and-statistics)
- [Validation and Error Handling](#validation-and-error-handling)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Development](#development)
- [Testing](#testing)
- [Production Build](#production-build)
- [Deployment](#deployment)
- [Development Workflow](#development-workflow)
- [Migration from the Previous System](#migration-from-the-previous-system)
- [Troubleshooting](#troubleshooting)
- [Project Requirements](#project-requirements)
- [Future Enhancements](#future-enhancements)
- [Support and Development](#support-and-development)

## Project Overview

The Student Attendance Tracking System replaces manual attendance processes with a centralized digital platform. Planned capabilities include:

- User authentication and role-based authorization
- User, department, student, lecturer, and course management
- Course enrollment and attendance-session management
- Attendance recording with Present, Absent, and Late statuses
- QR, GPS, manual, and optional face verification
- Attendance statistics, reports, search, filtering, sorting, and pagination
- Audit logging and secure server-side validation

## Core Features

### Authentication

- Secure login and logout
- Registration where permitted
- Password hashing and session management
- HTTP-only authentication cookies
- Protected routes and role-based authorization
- Session expiration and unauthorized-access handling

### Administrator Features

Administrators can manage users, departments, students, lecturers, courses, settings, and audit logs. They can also view attendance sessions, records, reports, and system-wide statistics.

### Lecturer Features

Lecturers can view assigned courses and enrolled students, create and control attendance sessions, configure verification methods, mark or correct attendance where authorized, and generate course reports.

### Student Features

Students can view their profile, enrolled courses, available sessions, attendance history, and statistics. They can submit attendance through the verification methods enabled for a session.

### Attendance Statuses

- **Present**
- **Absent**
- **Late**

## Technology Stack

- **Framework:** Next.js App Router, React, TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Lucide React, responsive design
- **Forms and validation:** React Hook Form, Zod, `@hookform/resolvers`
- **Data management:** Next.js Server Components and TanStack Query where client-side server state is needed
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Charts and reporting:** Recharts and date-fns
- **Device features:** Browser Camera API, QR scanning, Geolocation API, optional face verification

The current scaffold uses Next.js `16.2.12`, React `19.2.4`, TypeScript, ESLint, and Tailwind CSS. Dependencies for Prisma and the application features above should be added as those features are implemented.

## System Architecture

The application uses one full-stack Next.js deployment:

```text
Users (Admin, Lecturer, Student)
										|
										v
						 Next.js App Router
			 UI, Server Components, Middleware
			 Authentication and Authorization
										|
										v
						 Route Handlers (/api)
										|
										v
								 Prisma
										|
										v
							 PostgreSQL
```

Next.js provides the frontend, server-side application logic, API Route Handlers, authentication, authorization, and middleware. No separate Python or Django backend is required.

## User Roles

### Administrator

Responsibilities include user, department, student, lecturer, and course management, attendance monitoring, reporting, system configuration, and audit review.

Planned routes:

```text
/admin/dashboard
/admin/departments
/admin/students
/admin/lecturers
/admin/courses
/admin/attendance-reports
```

### Lecturer

Lecturers manage attendance for their assigned courses, including sessions, enrolled students, attendance marking, history, and course reports.

Planned routes:

```text
/lecturer/dashboard
/lecturer/sessions
/lecturer/mark-attendance
/lecturer/attendance-history
```

### Student

Students access their academic and attendance information and submit attendance for eligible sessions.

Planned routes:

```text
/student/dashboard
/student/sessions
/student/my-attendance
/student/mark-attendance
```

## Project Structure

The repository currently contains the initial scaffold:

```text
attendance/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

The planned structure adds `prisma/`, role-based routes under `app/`, API handlers, reusable components, services, libraries, hooks, types, and middleware as the features are implemented.

## Application Routes

Public routes:

```text
/login
/unauthorized
```

Protected administrator, lecturer, and student routes are listed in [User Roles](#user-roles). Unauthenticated users must be redirected to `/login`. Authenticated users without the required role must be redirected to `/unauthorized`.

## API Architecture

Next.js Route Handlers will provide the server-side API under `/api/`. The exact implementation must follow the Prisma schema and authorization rules rather than exposing unrestricted CRUD operations.

Planned endpoint groups include:

```text
POST /api/auth/login       POST /api/auth/register
POST /api/auth/logout      GET  /api/auth/session

GET|POST   /api/users              GET|PATCH|DELETE /api/users/[id]
GET|POST   /api/departments        GET|PATCH|DELETE /api/departments/[id]
GET|POST   /api/students           GET|PATCH|DELETE /api/students/[id]
GET|POST   /api/lecturers          GET|PATCH|DELETE /api/lecturers/[id]
GET|POST   /api/courses            GET|PATCH|DELETE /api/courses/[id]
GET|POST   /api/sessions           GET|PATCH|DELETE /api/sessions/[id]
GET|POST   /api/attendance         GET|PATCH|DELETE /api/attendance/[id]

POST /api/attendance/bulk
GET  /api/attendance/statistics
GET  /api/reports/attendance
GET  /api/reports/course
```

## Authentication and Authorization

Authentication is handled server-side by Next.js Route Handlers and Prisma. Phase 3 implements authentication only; role-based authorization and business permissions are reserved for Phase 4.

Authentication is handled server-side by Next.js:

```text
Login form -> POST /api/auth/login -> Verify password
					 -> Create session -> HTTP-only cookie
					 -> Middleware -> Role verification -> Protected route
```

Passwords must never be stored in plaintext, returned by APIs, logged, or exposed to client components. Every protected operation must verify that the user is authenticated, active, authorized for the role, and permitted to access the requested resource. Frontend route protection is not a substitute for server-side authorization.

The authentication endpoints are:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
```

Sessions use cryptographically random identifiers. Only a SHA-256 hash of the identifier is stored in PostgreSQL; the raw identifier exists only in the HTTP-only `attendance_session` cookie. Sessions expire after 30 days, are checked server-side on every lookup, and can be revoked individually or for all sessions belonging to a user.

Only users with `ACTIVE` account status can authenticate. `INACTIVE` and `SUSPENDED` accounts are rejected without exposing database details.

## Database Architecture

Prisma will provide database access and migrations for PostgreSQL:

```text
Next.js -> Prisma -> PostgreSQL
```

Core entities are `User`, `Department`, `Student`, `Lecturer`, `Course`, `CourseEnrollment`, `AttendanceSession`, `Attendance`, `AttendanceVerification`, and `AuditLog`.

Departments contain students, lecturers, and courses. Courses have enrollments and attendance sessions. Students have enrollments and attendance records. Lecturers have assigned courses and create attendance sessions. Sessions contain attendance records.

## Attendance System

The planned session workflow is:

```text
Lecturer selects course
	-> Creates and configures session
	-> Opens attendance
	-> Students submit attendance
	-> Server validates request and enrollment
	-> Attendance record is created
	-> Lecturer closes session
	-> Reports are updated
```

Each session may enable one or more verification methods: `QR`, `GPS`, `FACE`, or `MANUAL`. Duplicate attendance, closed sessions, invalid students, and invalid enrollments must be rejected server-side.

## Verification Methods

### QR Attendance

QR codes are associated with a specific session, validated server-side, time-limited where appropriate, protected against duplicate attendance, and invalid after the session closes.

### GPS Attendance

The browser provides coordinates, but the server performs the final distance calculation against the session radius. Client-provided validation results must never be trusted.

### Face Verification

Face verification is optional and must remain a separate module so it can be enabled, disabled, replaced, or improved independently.

## Reports and Statistics

Authorized administrators can view overall, department, course, lecturer, student, daily, weekly, and monthly attendance, including Present, Absent, and Late percentages.

Lecturers can view course attendance, student attendance, session statistics, history, and percentages. Students can view total sessions, Present/Absent/Late counts, overall percentage, and course-specific attendance.

## Validation and Error Handling

All request input must be validated on the server with Zod. Validation should cover required fields, string lengths, IDs, dates, times, email formats, roles, statuses, course relationships, session validity, and duplicate attendance.

API errors should use a consistent shape:

```json
{
	"success": false,
	"message": "You are not enrolled in this course."
}
```

## Security

- Use HTTP-only, secure cookies in production.
- Hash passwords and expire or invalidate sessions on logout.
- Authorize every sensitive API operation on the server.
- Never trust client-provided roles, user IDs, ownership, statuses, or GPS results.
- Validate input and output, use secure headers, and apply rate limiting where appropriate.
- Use HTTPS in production and keep secrets in environment variables.
- Maintain audit logs without writing sensitive information to application logs.

## Environment Variables

Create `.env.local` locally:

```env
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5433/attendance"
AUTH_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Never commit real secrets. Production values belong in the deployment platform's environment-variable configuration.

## Installation

### Prerequisites

- Node.js LTS
- npm
- PostgreSQL for database-backed features
- Git

No Python installation is required.

Install the current repository dependencies:

```bash
npm install
```

When database features are introduced, install the planned dependencies:

```bash
npm install @prisma/client bcryptjs zod react-hook-form @hookform/resolvers @tanstack/react-query lucide-react recharts date-fns
npm install -D prisma
npx prisma init
```

## Database Setup

Set `DATABASE_URL` and `SEED_ADMIN_PASSWORD` in a local `.env.local` file. Copy `.env.example` as a starting point. `SEED_ADMIN_PASSWORD` must contain at least 12 characters and is used only for development seed accounts; never use it as a production credential.

### PostgreSQL with Docker

Docker Compose provides the local PostgreSQL database without requiring a host PostgreSQL installation:

```bash
docker compose up -d postgres
```

The container uses PostgreSQL 16, stores data in the `attendance-postgres-data` volume, and exposes the database at `127.0.0.1:5433`. The local connection string is:

```env
DATABASE_URL="postgresql://attendance:attendance_dev_password@127.0.0.1:5433/attendance"
```

Stop the database while preserving its data with:

```bash
docker compose down
```

To remove the database volume as well, use `docker compose down -v`. This permanently deletes local database data.

After PostgreSQL is running and Prisma is installed, run:

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

The seed creates a development administrator at `admin@example.edu`, along with demo lecturer, student, department, course, enrollment, and draft session records. All seeded demo accounts use the local `SEED_ADMIN_PASSWORD` value. The seed uses upserts and can be run repeatedly without creating duplicate records.

Useful Prisma commands include:

```bash
npx prisma migrate status
npx prisma studio
```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

The completed system should be tested at several levels:

- **Unit:** validation, permissions, attendance calculations, GPS distance, reports, and utilities
- **Integration:** authentication, database operations, API routes, authorization, sessions, and attendance workflows
- **End-to-end:** login, dashboard, course/session creation, student attendance, and report generation

The current repository provides `lint`, `build`, `dev`, and `start` scripts. Dedicated test scripts should be added with the test framework selected for the project.

Authentication smoke tests run against the local Next.js server and Docker PostgreSQL database:

```bash
npm run dev -- --port 3100
npm run test:auth
```

The suite covers successful Admin/Lecturer/Student login, invalid credentials, inactive and suspended accounts, session retrieval, expiration, logout revocation, and password/session-secret exposure.

## Production Build

Run:

```bash
npm run lint
npm run build
npm start
```

Before deployment, verify database connectivity, environment variables, authentication, authorization, API routes, migrations, attendance workflows, reports, camera permissions, GPS permissions, and production security settings.

## Deployment

The system can be deployed as one Next.js application backed by PostgreSQL:

```text
Internet -> Next.js application -> Prisma -> PostgreSQL
```

Production configuration must include `DATABASE_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL`. Never commit production secrets.

## Development Workflow

1. **Foundation:** Configure Next.js, TypeScript, Tailwind, UI components, Prisma, PostgreSQL, and environment variables.
2. **Database:** Design the schema, migrations, seed data, relationships, and constraints.
3. **Authentication:** Implement login, logout, sessions, password hashing, middleware, role authorization, and the unauthorized page.
4. **Administration:** Build user, department, student, lecturer, course, dashboard, and reporting features.
5. **Lecturer:** Build course, enrollment, session, attendance marking, and history workflows.
6. **Student:** Build course, session, attendance submission, history, and statistics workflows.
7. **Verification:** Add QR, GPS, optional face verification, duplicate prevention, and session validation.
8. **Reporting:** Add reports, charts, filters, statistics, and required exports.
9. **Security:** Audit authentication, authorization, validation, API security, rate limiting, and logging.
10. **Testing:** Add unit, integration, API, authentication, authorization, attendance, and end-to-end tests.
11. **Deployment:** Configure production PostgreSQL, HTTPS, migrations, monitoring, and backups.

## Migration from the Previous System

The previous system used `React + Vite + Django REST Framework + SQLite/PostgreSQL`. The new system uses `Next.js + TypeScript + Next.js Route Handlers + Prisma + PostgreSQL`.

The migration should preserve administrator, lecturer, and student functionality; authentication; role permissions; courses; attendance sessions and records; Present/Absent/Late states; QR and GPS verification; optional face verification; statistics; reports; search; filtering; and pagination. The old Django/Python backend is not required for the new system.

## Troubleshooting

- **PostgreSQL connection:** Check `DATABASE_URL` and confirm PostgreSQL is running.
- **Prisma client:** Run `npx prisma generate` after installing Prisma or changing the schema.
- **Migration errors:** Run `npx prisma migrate status` and inspect migration history before creating another migration.
- **Authentication failure:** Verify the user, active status, password hash, `AUTH_SECRET`, authentication cookie, and middleware configuration.
- **Camera or GPS failure:** Check browser permissions, HTTPS in production, device availability, valid coordinates, and session settings.

## Project Requirements

### Functional

Authentication, role authorization, user and academic management, enrollment, session management, attendance recording, Present/Absent/Late statuses, QR/GPS/optional face verification, history, statistics, reports, search, filtering, sorting, pagination, and audit logging.

### Technical

Next.js, TypeScript, App Router, PostgreSQL, Prisma, secure server-side authentication and authorization, server-side validation, responsive UI, production-ready error handling, secure environment variables, migrations, and automated testing.

### Non-functional

The application should be secure, reliable, maintainable, scalable, responsive, accessible, easy to administer, easy to extend, and production-ready.

## Future Enhancements

Possible additions include email, SMS, and push notifications; advanced analytics and attendance prediction; mobile applications; Excel/PDF exports; low-attendance alerts; multiple institutions or campuses; academic-year and semester management; timetable integration; examination integration; and advanced audit trails.

## License

No project license has been selected yet. Add the appropriate license before distributing the application.

## Support and Development

When modifying the application:

1. Do not bypass authentication or authorization.
2. Do not directly manipulate production data.
3. Use Prisma migrations for database changes.
4. Validate all API input on the server.
5. Keep business logic on the server.
6. Keep credentials out of the repository.
7. Test changes before deployment.
8. Maintain consistent TypeScript types.
9. Update this README when architecture or major functionality changes.

## Final Architecture Principle

The entire application is implemented using Next.js and TypeScript. Next.js provides the frontend, server-side logic, API Route Handlers, authentication, authorization, and middleware. Prisma provides database access and migrations, while PostgreSQL provides persistent storage.

**No Python or Django backend is required.**
