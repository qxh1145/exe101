# Story 1.3: Demographic Profile Update

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Context

**Epic:** Epic 1: User Onboarding & Core Wallet
**Story:** 1.3: Demographic Profile Update

As a Người dùng đã đăng ký,
I want cập nhật hồ sơ nhân khẩu học của mình (Chuyên ngành, Năm học, Độ tuổi),
So that hệ thống có thể phân phối cho tôi những bài khảo sát nhắm đúng đối tượng.

## Acceptance Criteria

1. **Given** tôi là người dùng đã đăng nhập nhưng chưa hoàn thiện hồ sơ (OnboardingStatus is `PENDING`)
   **When** tôi điền đầy đủ các thông tin nhân khẩu học hợp lệ (major, year, age) trên giao diện Onboarding và bấm Lưu
   **Then** dữ liệu nhân khẩu học của tôi được lưu thành công vào cơ sở dữ liệu
2. **And** trạng thái Onboarding của tôi được chuyển sang `COMPLETED`
3. **And** giao diện UI thông báo thành công và chuyển hướng tôi đến `/dashboard`.

## Tasks / Subtasks

- [x] Task 1: Backend Profile Update API (AC: 1, 2)
  - [x] Create Zod validator `profile.validator.js` for `major` (string), `year` (number), `age` (number).
  - [x] Implement `updateProfile` in `user.service.js` (or `profile.service.js`):
    - Update `User` record with `major`, `year`, `age`.
    - Change `onboardingStatus` to `COMPLETED`.
  - [x] Create `user.controller.js` and `user.routes.js`.
  - [x] Mount `/api/v1/users` in `routes/index.js` (protect with `authMiddleware`).
- [x] Task 2: Frontend Onboarding UI (AC: 1, 2, 3)
  - [x] Create `/onboarding/page.tsx` with a form for Major, Academic Year, and Age.
  - [x] Add `updateProfile` mutation endpoint to `apiSlice.ts`.
  - [x] Handle successful form submission by calling API and redirecting to `/dashboard`.
  - [x] Ensure Redux `authSlice` state is updated (if it caches user details) to reflect `onboardingStatus: 'COMPLETED'`.

## Dev Notes

- **Relevant architecture patterns and constraints**:
  - Keep using `zod` for validation middleware.
  - Use existing Global Error Handler.
  - `authMiddleware` is required to authenticate the user and get `req.user.id`.
- **Dependencies**: None additional required.

### Completion Notes List

### Completion Notes List

- ✅ All tests passed. Backend accurately validates payload.
- ✅ Successfully implemented Redux state updates (`updateUser` in authSlice) so UI is immediately aware of the new demographic and `COMPLETED` onboarding status.
- ✅ Registration redirect correctly points to `/onboarding` which now exists and successfully pushes to `/dashboard` upon completion.

### File List

- `backend/src/validators/profile.validator.js`
- `backend/src/services/user.service.js`
- `backend/src/controllers/user.controller.js`
- `backend/src/routes/user.routes.js`
- `backend/src/routes/index.js`
- `frontend/src/store/api/apiSlice.ts`
- `frontend/src/store/slices/authSlice.ts`
- `frontend/src/app/(auth)/onboarding/page.tsx`

### Review Findings

- [x] [Review][Patch] Cần thêm `.trim()` và `.max(100)` cho trường `major` trong `profile.validator.js` để tránh chuỗi quá dài gây DoS. [backend/src/validators/profile.validator.js:4]
- [x] [Review][Patch] Trong middleware `validate-request.js`, cần gán lại `req.body = schema.parse(req.body)` thay vì chỉ gọi `schema.parse()` để loại bỏ các trường dư thừa (strip unknown) và áp dụng các transform của Zod. [backend/src/core/validate-request.js:7]
- [x] [Review][Defer] `updateProfile` trong service vẫn cho phép cập nhật dữ liệu khi trạng thái đã là `COMPLETED`. (Chưa chặn người dùng cũ). — deferred, pre-existing
