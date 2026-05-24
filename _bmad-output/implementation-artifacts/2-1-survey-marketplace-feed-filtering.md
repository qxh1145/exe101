# Story 2.1: Survey Marketplace Feed & Demographic Filtering

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Người làm khảo sát (Respondent),
I want xem danh sách các bài khảo sát đang hoạt động và phù hợp với hồ sơ của mình trên Marketplace,
So that tôi có thể dễ dàng chọn bài để kiếm điểm mà không mất thời gian vào những khảo sát không đúng đối tượng.

## Acceptance Criteria

1. **Given** tôi là người dùng đã đăng nhập và đã hoàn tất hồ sơ nhân khẩu học
2. **When** tôi truy cập vào trang Marketplace (Chợ Khảo sát)
3. **Then** hệ thống chỉ hiển thị danh sách các khảo sát có trạng thái là `ACTIVE` và chưa hết hạn (`expiresAt > now()`)
4. **And** các khảo sát hiển thị bắt buộc phải có mục tiêu nhân khẩu học (Major, Year, Age) khớp với hồ sơ của tôi (hoặc khảo sát không giới hạn nhân khẩu học)
5. **And** các khảo sát mà tôi đã hoàn thành rồi, hoặc đang trong thời gian làm dở dang, sẽ bị ẩn đi hoặc đánh dấu mờ
6. **And** trên mỗi thẻ (Card) khảo sát hiển thị rõ số Điểm thưởng và Thời gian làm dự kiến.

## Tasks / Subtasks

- [x] Task 1: Backend API for Marketplace Feed (AC: 1, 3, 4, 5, 6)
  - [x] Inspect Prisma Schema (`backend/prisma/schema.prisma`) for `Survey` and submission relations to build correct queries.
  - [x] Implement `getMarketplaceSurveys` in `survey.service.js`:
    - Only fetch `status === 'ACTIVE'` and `expiresAt > new Date()`.
    - Apply Demographic filtering: If `targetMajor` is present on Survey, it must match user's `major`, etc. Null means "All".
    - Filter out surveys the user has already submitted/started.
  - [x] Create `survey.controller.js` and mount `GET /api/v1/surveys/marketplace`.
- [x] Task 2: Frontend Marketplace UI (AC: 2, 6)
  - [x] Create or update Marketplace UI component (e.g., `/dashboard/page.tsx` or `/marketplace/page.tsx`).
  - [x] Add `useGetMarketplaceSurveysQuery` in `frontend/src/store/api/apiSlice.ts`.
  - [x] Build a sleek Survey Card component displaying: Title, Reward, Estimated Time.
  - [x] Handle empty states gracefully ("No surveys found").

## Dev Notes

- **Relevant architecture patterns and constraints**:
  - Keep using `zod` for request validation if adding pagination or filters.
  - Use existing `authMiddleware` to extract `req.user`.
  - `sendSuccess` is the correct response formatter (`import { sendSuccess } from '../core/response-formatter.js'`).
- **Previous Learnings (Story 1.3)**:
  - From Story 1.3 code review: Always reassign parsed body/query from zod `req.query = schema.parse(req.query)` to strip unknown fields.
  - Keep endpoints protected.

### References
- Epic 2 Definition: `_bmad-output/planning-artifacts/epics.md`

## Dev Agent Record

### Agent Model Used

Antigravity

### Debug Log References

### Completion Notes List

- ✅ All Backend tests passed. Implemented demographic filters, status checks, expiry checks, and session exclusions perfectly.
- ✅ Successfully implemented UI Dashboard with Marketplace feed and Loading/Empty states.
- ✅ Redux automatically fetches and displays the filtered data upon login based on user demographic info.

### File List

- `backend/src/core/auth-middleware.js`
- `backend/src/services/survey.service.js`
- `backend/src/controllers/survey.controller.js`
- `backend/src/routes/survey.routes.js`
- `backend/src/routes/index.js`
- `backend/tests/api/survey.test.js`
- `frontend/src/store/api/apiSlice.ts`
- `frontend/src/components/dashboard/Navbar.tsx`
- `frontend/src/components/dashboard/SurveyCard.tsx`
- `frontend/src/app/(dashboard)/layout.tsx`
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
