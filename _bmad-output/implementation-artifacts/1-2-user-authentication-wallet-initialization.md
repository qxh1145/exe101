# Story 1.2: User Authentication & Wallet Initialization

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Context

**Epic:** Epic 1: User Onboarding & Core Wallet
**Story:** 1.2: User Authentication & Wallet Initialization

As a Người dùng mới,
I want đăng ký tài khoản bằng email/mật khẩu,
So that tôi có thể tham gia hệ thống và tự động nhận được 50 điểm khởi đầu.

## Acceptance Criteria

1. **Given** tôi là khách truy cập đang ở trang Đăng ký (Register Page)
   **When** tôi nhập email, mật khẩu hợp lệ và bấm Đăng ký
   **Then** tài khoản `User` của tôi được tạo thành công
2. **And** hệ thống tự động tạo một `Wallet` đi kèm với tài khoản của tôi
3. **And** hệ thống tự động tạo một giao dịch `LedgerEntry` cộng 50 điểm với loại giao dịch là `STARTER_LOCKED_RELEASE` ở trạng thái `PENDING`
4. **And** tôi được đăng nhập thành công vào hệ thống thông qua HTTP-Only Cookie
5. **And** hệ thống chỉ cho phép đăng nhập trên 1 thiết bị duy nhất bằng cách lưu `currentSessionId` vào Database và Cookie, tự động vô hiệu hóa (401 Unauthorized) các thiết bị đăng nhập cũ.

## Tasks / Subtasks

- [x] Task 1: Auth Backend Setup & Utilities (AC: 1, 4)
  - [x] Implement password hashing utility using `bcrypt` (`backend/src/utils/hash.js`).
  - [x] Implement JWT token generator and verifier using `jsonwebtoken` for HTTP-Only cookies (`backend/src/utils/token.js`).
  - [x] Set up the Global Error Handler and Auth Middleware.
- [x] Task 2: Implement Registration Logic & Wallet Initialization (AC: 1, 2, 3)
  - [x] Create `auth.validator.js` for input validation using Zod.
  - [x] Create `auth.service.js` -> `registerUser`: Handles user creation, wallet initialization, and creates the 50 point `STARTER_LOCKED_RELEASE` `PENDING` ledger entry within a `prisma.$transaction`.
- [x] Task 3: Implement Login & Single Device Session (AC: 4, 5)
  - [x] Implement `loginUser` in `auth.service.js`: verify password, generate a unique `currentSessionId`, update it in the User DB, and issue JWTs (Access & Refresh) in HTTP-Only cookies containing the `currentSessionId`.
  - [x] Update Auth Middleware to verify the incoming JWT's `currentSessionId` matches the database `currentSessionId`. If mismatch, throw `UnauthorizedError`.
- [x] Task 4: Frontend Auth Pages (AC: 1, 4)
  - [x] Create RTK Query endpoints for `register` and `login` in `frontend/src/store/api/apiSlice.ts`.
  - [x] Create `/register` and `/login` pages using Tailwind and Next.js.
  - [x] Handle successful authentication by redirecting to `/onboarding`.

## Dev Notes

- **Relevant architecture patterns and constraints**:
  - Store tokens as `httpOnly` cookies. Access Token (15m), Refresh Token (7d).
  - Use `prisma.$transaction` for registering user and creating wallet + ledger entry simultaneously.
  - Apply Clean Code structure: `Routes -> Controller -> Service -> Repository`.
  - Do NOT use `try/catch` in controllers; let the Global Error Middleware handle errors.
- **Dependencies**: `bcrypt` (or `bcryptjs`), `jsonwebtoken`, `zod`, `cookie-parser` (if not already handled) in backend.

### Completion Notes List

- ✅ Backend Auth infrastructure (custom errors, global handler, validation wrapper) implemented
- ✅ Wallet initialization + Ledger creation via `prisma.$transaction` configured
- ✅ HTTP-Only cookies integrated
- ✅ Single-device login established using `currentSessionId`
- ✅ Frontend Redux (RTK Query + Auth Slice) configured for robust state management
- ✅ Login and Register pages mapped out with aesthetic UI

### Review Findings

- [x] [Review][Patch] Hardcoded Secrets (JWT fallbacks) [backend/src/utils/token.js]
- [x] [Review][Patch] Missing password max length in Zod [backend/src/validators/auth.validator.js]
- [x] [Review][Patch] Error Leakage / XSS risk in UI [frontend/src/app/(auth)/login/page.tsx]
- [x] [Review][Defer] Missing Rate Limiting on Auth endpoints [backend/src/routes/auth.routes.js] — deferred, pre-existing

### File List

- `backend/package.json`
- `backend/prisma/seed.js`
- `backend/src/config/prisma.js`
- `backend/src/core/custom-errors.js`
- `backend/src/core/error-handler.js`
- `backend/src/core/response-formatter.js`
- `backend/src/core/validate-request.js`
- `backend/src/core/auth-middleware.js`
- `backend/src/utils/hash.js`
- `backend/src/utils/token.js`
- `backend/src/validators/auth.validator.js`
- `backend/src/services/auth.service.js`
- `backend/src/controllers/auth.controller.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/routes/index.js`
- `backend/src/app.js`
- `backend/src/server.js`
- `frontend/src/store/store.ts`
- `frontend/src/store/provider.tsx`
- `frontend/src/store/slices/authSlice.ts`
- `frontend/src/store/api/apiSlice.ts`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/(auth)/layout.tsx`
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(auth)/register/page.tsx`
