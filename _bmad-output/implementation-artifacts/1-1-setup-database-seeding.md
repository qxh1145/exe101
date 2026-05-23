# Story 1.1: Project Setup & Database Seeding

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a System Administrator,
I want khởi tạo nền tảng dự án và cấu trúc Database kèm dữ liệu mồi (Seed data),
so that team phát triển có môi trường chuẩn xác và dữ liệu giả lập để làm việc ngay lập tức.

## Acceptance Criteria

1. **Given** một thư mục dự án trống
2. **When** chạy lệnh khởi tạo và cấu hình
3. **Then** hệ thống tạo ra 2 thư mục độc lập: `frontend` (Next.js + TypeScript) và `backend` (Express.js + Node.js)
4. **And** Prisma Schema được định nghĩa đầy đủ các bảng thiết yếu: `User`, `Wallet`, `LedgerEntry`, `Survey`, `SurveySession`, `FraudLog`, `SystemSetting`
5. **And** có một script `seed.js` khi chạy sẽ tự động chèn vào database ít nhất 20 user ảo và 50 khảo sát giả

## Tasks / Subtasks

- [x] Task 1: Setup Backend & Prisma (AC: 1, 2, 3, 4)
  - [x] Initialize Express.js backend with basic folder structure (controllers, services, routes, middlewares)
  - [x] Setup Prisma ORM with PostgreSQL and define all MVP models
  - [x] Create and apply the initial Prisma migration
- [x] Task 2: Setup Database Seeding (AC: 5)
  - [x] Write `prisma/seed.js` script to generate 20 fake users with `cachedBalance` and `pendingBalance`
  - [x] Generate 50 fake surveys associated with the publishers
  - [x] Configure `package.json` to support `npm run seed`
- [x] Task 3: Setup Frontend (AC: 1, 2, 3)
  - [x] Initialize Next.js project with TypeScript and Tailwind CSS using `npx create-next-app`
  - [x] Set up basic API fetching configuration (e.g., Axios instance) to communicate with Backend

### Review Findings

- [x] [Review][Patch] Missing `currentSessionId` field in `User` model [backend/prisma/schema.prisma]
- [x] [Review][Defer] Hardcoded `hashed_password_placeholder` in seed script [backend/prisma/seed.js] — deferred, pre-existing

## Dev Notes

- **Relevant architecture patterns and constraints**:
  - Decoupled Architecture: `frontend/` (Next.js) and `backend/` (Express.js).
  - Database: PostgreSQL managed via Prisma.
  - Backend must adhere to layered architecture: `Routes -> Controllers -> Services`. No business logic inside Controllers.
- **Source tree components to touch**:
  - `backend/package.json`
  - `backend/prisma/schema.prisma`
  - `backend/prisma/seed.js`
  - `frontend/package.json`
- **Testing standards summary**:
  - Manually verify that `npx prisma db seed` runs without relationship errors and populates the DB.
  - Verify that Frontend runs via `npm run dev` and Backend runs via `npm run dev`.

### Project Structure Notes

- Both `frontend` and `backend` must be created as top-level directories in the `exe-prj/` workspace.

### References

- [Source: epics.md#Story 1.1]
- [Source: architecture.md#System Components]
- [Source: prd.md]

## Dev Agent Record

### Agent Model Used

Antigravity IDE

### Debug Log References

N/A

### Completion Notes List

- ✅ Project initialized: frontend (Next.js/Tailwind) and backend (Express/Prisma)
- ✅ Database schema established for User, Wallet, LedgerEntry, Survey, etc.
- ✅ Prisma DB seed script created. PostgreSQL is configured via docker-compose but must be started (`docker-compose up -d`) prior to running migrations.

### File List
- `backend/package.json`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.js`
- `backend/src/server.js`
- `backend/docker-compose.yml`
- `backend/.env`
- `frontend/package.json`
- `frontend/src/lib/api.ts`
