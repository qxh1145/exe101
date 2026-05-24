# Story 2.2: Survey Creation UI

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Người tạo khảo sát (Publisher),
I want một giao diện Form để cấu hình khảo sát mới cùng các tiêu chí nhắm mục tiêu,
So that tôi có thể chỉ định chính xác ai là người được làm khảo sát và mức thưởng là bao nhiêu.

## Acceptance Criteria

1. **Given** tôi là người dùng có số dư khả dụng (Available Balance) lớn hơn 0
2. **When** tôi vào trang "Đăng khảo sát"
3. **Then** tôi có thể nhập link Google/Microsoft Forms, mã bí mật (Completion Code), thời gian làm dự kiến (phút), số lượng mẫu cần thu thập (responses count), điểm thưởng cho mỗi mẫu, và cài đặt Thời gian hết hạn (Expiration Time)
4. **And** tôi có thể chọn các bộ lọc nhân khẩu học
5. **And** giao diện sẽ tự động tính toán số điểm Tổng cần khóa vào quỹ (Tổng = số mẫu * điểm mỗi mẫu)
6. **And** hiển thị thông báo rõ ràng: "Số điểm không được sử dụng hết sau thời hạn này sẽ được tự động hoàn trả về ví của bạn"
7. **And** nút "Publish" sẽ bị vô hiệu hóa (disabled) nếu Tổng điểm vượt quá số dư hiện tại của tôi.

## Tasks / Subtasks

- [ ] Task 1: API Endpoint & Schema Validation (AC: 3, 4)
  - [ ] Create `backend/src/validators/survey.validator.js` with `createSurveySchema` using Zod (validating URL, positive numbers, expiration time, target demographics).
  - [ ] Add `createSurveyHandler` in `backend/src/controllers/survey.controller.js`.
  - [ ] Mount `POST /api/v1/surveys` route in `backend/src/routes/survey.routes.js` using `authMiddleware` and `validateRequest(createSurveySchema)`.
  - [ ] Create `createSurvey` function signature in `backend/src/services/survey.service.js` (implement basic database insert here, complex Escrow Transaction will be fully covered in Story 2.3).
- [ ] Task 2: Frontend Data Fetching & State (AC: 1, 5, 7)
  - [ ] Update `frontend/src/store/api/apiSlice.ts` to include `useCreateSurveyMutation`.
  - [ ] Ensure `useGetWalletBalanceQuery` is available to fetch current user's available balance to compare against total escrow points.
- [ ] Task 3: Survey Creation Form UI (AC: 2, 3, 4, 5, 6, 7)
  - [ ] Create `frontend/src/app/(dashboard)/surveys/create/page.tsx` with a React Hook Form or standard controlled form.
  - [ ] Add input fields for URL, Completion Code, Estimated Time, Responses Count, Reward per response, and Expiration Date.
  - [ ] Add selection components for target demographics (Major, Year, Age).
  - [ ] Implement reactive Total Points calculation: `totalPoints = responsesCount * rewardPerResponse`.
  - [ ] Display warning message about auto-refund for unused points after expiration.
  - [ ] Disable the "Publish" button if `totalPoints > cachedBalance` or if form is invalid.
  - [ ] Connect form submission to `useCreateSurveyMutation`.

## Dev Notes

- **Relevant architecture patterns and constraints**:
  - Keep UI components inside `components/organisms` if complex, or inline in `page.tsx` if simple.
  - Follow the API Response standardization (`sendSuccess` and Custom Errors).
  - Zod should strip out unknown fields in validation layer.
  - ES Modules must be used in the Backend.
- **Source tree components to touch**:
  - `backend/src/validators/survey.validator.js`
  - `backend/src/routes/survey.routes.js`
  - `backend/src/controllers/survey.controller.js`
  - `backend/src/services/survey.service.js`
  - `frontend/src/app/(dashboard)/surveys/create/page.tsx`
  - `frontend/src/store/api/apiSlice.ts`
- **Previous Learnings (Story 2.1)**:
  - From Story 2.1, survey retrieval logic already relies on demographic filters. Ensure the fields added in the creation form match the exact types/keys used in the database schema (`targetMajor`, `targetYear`, etc.).
- **Testing standards summary**:
  - Unit test `createSurveySchema` validator to ensure valid/invalid payloads are handled.
  - Add simple UI tests if configured, or manually verify form behavior (disabled state).

### Project Structure Notes

- Alignment with unified project structure: `backend/src/validators/` for Zod schemas, RTK Query in `apiSlice.ts`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architecture Decisions]

## Dev Agent Record

### Agent Model Used

Antigravity

### Debug Log References

### Completion Notes List

### File List
