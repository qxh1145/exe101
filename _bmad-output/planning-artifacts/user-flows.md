# Rescom — Tài liệu Luồng Hoạt động Chi tiết (User Flows)

**Mục đích:** Mô tả chi tiết từng bước tương tác giữa các Actor (Người dùng, Frontend, Backend, Database, Bên thứ 3) cho toàn bộ tính năng của hệ thống Rescom. Tài liệu này phục vụ trực tiếp cho việc vẽ Sequence Diagram.

**Quy ước đọc:**
- **Actor** được ghi in đậm: **User**, **Frontend (FE)**, **Backend (BE)**, **Database (DB)**, **Google Forms**, **Cron Job**
- Mỗi bước được đánh số tuần tự
- `→` = gửi request / gọi hàm
- `←` = trả response / kết quả
- `⚡` = hành động xảy ra bên trong hệ thống (không có request từ bên ngoài)

---

## Flow 1: Đăng ký Tài khoản (User Registration)

**Actors:** User, FE, BE, DB

### Luồng chính (Happy Path)

1. **User** → **FE**: Nhập email, mật khẩu trên trang `/register` và bấm "Đăng ký"
2. **FE** → **FE**: Validate dữ liệu bằng Zod schema (email format, password length ≥ 8)
3. **FE** → **BE**: `POST /api/v1/auth/register` — Body: `{ email, password }`
4. **BE** → **BE**: Middleware chain: `helmet → cors → express.json → rateLimiter → submitCodeValidator (Zod)`
5. **BE** → **DB**: Kiểm tra email đã tồn tại chưa — `SELECT * FROM "User" WHERE email = ?`
6. **DB** → **BE**: Trả kết quả (null = chưa tồn tại)
7. **BE** → **BE**: Hash mật khẩu bằng bcrypt
8. **BE** → **DB**: Mở `prisma.$transaction`:
   - 8a. Tạo bản ghi `User` mới (email, hashedPassword, onboardingStep = 'REGISTER')
   - 8b. Tạo bản ghi `Wallet` đi kèm (cachedBalance = 0, pendingBalance = 0)
   - 8c. Tạo bản ghi `LedgerEntry` (type = 'STARTER_LOCKED_RELEASE', amount = 50, status = 'PENDING')
9. **DB** → **BE**: Commit transaction thành công
10. **BE** → **BE**: Tạo Access Token (JWT, 15 phút) + Refresh Token (JWT, 7 ngày). Lưu `currentSessionId` vào bản ghi User trong DB
11. **BE** → **FE**: Set HTTP-Only Cookie chứa Access Token + Refresh Token. Response: `{ success: true, data: { user, wallet } }`
12. **FE** → **FE**: Lưu thông tin user vào Redux `authSlice`. Redirect sang `/onboarding`

### Luồng lỗi

- **Bước 5 — Email đã tồn tại:** BE ném `ConflictError("Email đã được sử dụng")` → Global Error Middleware trả `409`
- **Bước 2 — Validate thất bại (FE):** FE hiển thị inline error, không gửi request
- **Bước 4 — Validate thất bại (BE):** Zod validator ném `BadRequestError` → `400`

---

## Flow 2: Đăng nhập (User Login)

**Actors:** User, FE, BE, DB

### Luồng chính

1. **User** → **FE**: Nhập email, mật khẩu trên trang `/login` và bấm "Đăng nhập"
2. **FE** → **BE**: `POST /api/v1/auth/login` — Body: `{ email, password }`
3. **BE** → **DB**: Tìm User theo email — `SELECT * FROM "User" WHERE email = ?`
4. **DB** → **BE**: Trả bản ghi User (hoặc null)
5. **BE** → **BE**: So sánh password với hash (bcrypt.compare)
6. **BE** → **BE**: Tạo Access Token + Refresh Token mới. Cập nhật `currentSessionId` trong DB (vô hiệu hóa các session cũ trên thiết bị khác)
7. **BE** → **FE**: Set HTTP-Only Cookie. Response: `{ success: true, data: { user, onboardingStep } }`
8. **FE** → **FE**: Kiểm tra `onboardingStep`:
   - Nếu `COMPLETED` → redirect `/dashboard`
   - Nếu khác → redirect `/onboarding`

### Luồng lỗi

- **Bước 4 — User không tồn tại:** BE ném `UnauthorizedError("Email hoặc mật khẩu không đúng")` → `401`
- **Bước 5 — Sai mật khẩu:** BE ném `UnauthorizedError("Email hoặc mật khẩu không đúng")` → `401`

---

## Flow 3: Refresh Token (Tự động gia hạn phiên)

**Actors:** FE, BE, DB

### Luồng chính

1. **FE** → **BE**: `POST /api/v1/auth/refresh` — Cookie chứa Refresh Token
2. **BE** → **BE**: Verify Refresh Token (JWT verify). Trích xuất userId
3. **BE** → **DB**: Kiểm tra `currentSessionId` trong DB khớp với session trong token
4. **BE** → **BE**: Tạo Access Token mới (15 phút)
5. **BE** → **FE**: Set Cookie mới chứa Access Token. Response: `{ success: true }`

### Luồng lỗi

- **Bước 2 — Token hết hạn / không hợp lệ:** BE ném `UnauthorizedError` → `401`. FE redirect về `/login`
- **Bước 3 — Session không khớp (đã đăng nhập từ thiết bị khác):** BE ném `UnauthorizedError("Phiên đã hết hạn, vui lòng đăng nhập lại")` → `401`

---

## Flow 4: Đăng xuất (Logout)

**Actors:** User, FE, BE, DB

### Luồng chính

1. **User** → **FE**: Bấm nút "Đăng xuất"
2. **FE** → **BE**: `POST /api/v1/auth/logout` — Cookie chứa Access Token
3. **BE** → **DB**: Xóa `currentSessionId` của User
4. **BE** → **FE**: Xóa HTTP-Only Cookie (set maxAge = 0). Response: `{ success: true }`
5. **FE** → **FE**: Reset Redux store (clear authSlice, walletSlice). Redirect `/login`

---

## Flow 5: Cập nhật Hồ sơ Nhân khẩu học (Demographic Profile)

**Actors:** User, FE, BE, DB

### Luồng chính

1. **User** → **FE**: Trên trang `/onboarding`, điền thông tin: Chuyên ngành (Major), Năm học (Year), Độ tuổi (Age)
2. **FE** → **FE**: Validate bằng Zod (các trường required, enum values hợp lệ)
3. **FE** → **BE**: `POST /api/v1/profile/me/demographic` — Body: `{ major, year, age }`
4. **BE** → **BE**: authMiddleware verify JWT → trích xuất userId
5. **BE** → **DB**: Cập nhật thông tin nhân khẩu học vào bản ghi User
6. **BE** → **DB**: Cập nhật `onboardingStep` = 'DEMOGRAPHIC_SURVEY'
7. **DB** → **BE**: OK
8. **BE** → **FE**: Response: `{ success: true, data: { onboardingStep: 'DEMOGRAPHIC_SURVEY' } }`
9. **FE** → **FE**: Cập nhật Redux `authSlice` với onboardingStep mới. Chuyển sang bước tiếp theo trong Onboarding Wizard (gợi ý User làm 1 bài khảo sát cộng đồng đầu tiên)

---

## Flow 6: Duyệt Chợ Khảo sát (Survey Marketplace)

**Actors:** User, FE, BE, DB

### Luồng chính

1. **User** → **FE**: Truy cập trang `/surveys` (Marketplace)
2. **FE** → **BE**: `GET /api/v1/surveys?page=1&pageSize=20` — Cookie chứa Access Token
3. **BE** → **BE**: authMiddleware verify JWT → trích xuất userId
4. **BE** → **DB**: Truy vấn bản ghi User để lấy hồ sơ nhân khẩu học (major, year, age)
5. **BE** → **DB**: `demographicMatchingService` thực hiện SQL query:
   - Lọc các khảo sát có `status = 'ACTIVE'` VÀ `expiresAt > NOW()`
   - Lọc theo demographic matching: Major, Year, Age phải khớp (hoặc khảo sát không giới hạn demographic)
   - Loại bỏ các khảo sát User đã hoàn thành hoặc đang làm dở
   - Loại bỏ khảo sát do chính User tạo
   - Sắp xếp và phân trang
6. **DB** → **BE**: Trả danh sách khảo sát đã lọc
7. **BE** → **FE**: Response: `{ success: true, data: [surveys], meta: { page, pageSize, totalItems, totalPages } }`
8. **FE** → **FE**: RTK Query cache kết quả. Render danh sách SurveyCard trên Marketplace

---

## Flow 7: Tạo & Đăng Khảo sát (Survey Creation + Escrow Deduction)

**Actors:** User (Publisher), FE, BE, DB

### Luồng chính

1. **User** → **FE**: Truy cập trang `/surveys/create`. Nhập thông tin:
   - Link Google Forms URL
   - Completion Code (mã bí mật)
   - Estimated Time (thời gian làm dự kiến, phút)
   - Target Responses (số lượng mẫu cần thu thập)
   - Bounty Per Response (điểm thưởng mỗi mẫu)
   - Expiration Time (thời hạn hết hạn)
   - Demographic Filters (Chuyên ngành, Năm học, Độ tuổi — tuỳ chọn)
2. **FE** → **FE**: Tự động tính tổng Escrow = Target Responses × Bounty. Hiển thị số điểm cần khóa
3. **FE** → **FE**: Validate: nếu Tổng Escrow > số dư hiện tại (từ walletSlice) → disable nút Publish + hiển thị cảnh báo
4. **User** → **FE**: Bấm "Publish"
5. **FE** → **BE**: `POST /api/v1/surveys` — Body: `{ formUrl, completionCode, estimatedTime, targetResponses, bountyPerResponse, expiresAt, demographicFilters }`
6. **BE** → **BE**: authMiddleware → surveyValidator (Zod)
7. **BE** → **DB**: Mở `prisma.$transaction`:
   - 7a. `walletRepository.lockWalletByUserId(userId)` — `SELECT * FROM "Wallet" WHERE "userId" = ? FOR UPDATE`
   - 7b. Kiểm tra `cachedBalance >= totalEscrow`. Nếu không đủ → ném `BadRequestError("Không đủ điểm")`
   - 7c. Trừ `cachedBalance` đi `totalEscrow`
   - 7d. Tạo `LedgerEntry` (type = 'PUBLISH_SURVEY_ESCROW', amount = -totalEscrow, status = 'COMPLETED')
   - 7e. Tạo bản ghi `Survey` (status = 'ACTIVE', escrowAmount = totalEscrow, remainingSlots = targetResponses)
8. **DB** → **BE**: Commit transaction thành công
9. **BE** → **FE**: Response: `{ success: true, data: { survey, wallet: { cachedBalance } } }`
10. **FE** → **FE**: RTK Query invalidate tag `'Wallet'` và `'Survey'`. Redirect sang `/surveys/my`

### Luồng lỗi

- **Bước 7b — Không đủ điểm:** Transaction rollback. BE trả `BadRequestError` → `400`. FE hiển thị gợi ý "Đi làm khảo sát để kiếm thêm điểm"
- **Bước 7a — Race Condition (2 tab cùng lúc):** Row-Level Lock tự động serialize → tab thứ 2 sẽ thấy số dư đã bị trừ → thất bại tự nhiên ở bước 7b

---

## Flow 8: Bắt đầu Làm Khảo sát (Survey Start + Time Barrier Initiation)

**Actors:** User (Respondent), FE, BE, DB, Google Forms

### Luồng chính

1. **User** → **FE**: Trên Marketplace, bấm vào một SurveyCard → chuyển sang trang `/surveys/:id`
2. **FE** → **BE**: `GET /api/v1/surveys/:id` — lấy thông tin chi tiết khảo sát
3. **BE** → **FE**: Trả thông tin khảo sát (tiêu đề, bounty, estimatedTime, remainingSlots)
4. **User** → **FE**: Bấm nút "Bắt đầu Khảo sát"
5. **FE** → **BE**: `POST /api/v1/surveys/:id/start`
6. **BE** → **BE**: authMiddleware → trích xuất userId
7. **BE** → **BE**: `fraudDetectionService.checkConcurrentLimit(userId)` — Kiểm tra User có đang làm quá nhiều khảo sát cùng lúc không (Hoarding Prevention)
8. **BE** → **DB**: Tạo bản ghi `SurveySession` (userId, surveyId, startTime = NOW(), status = 'IN_PROGRESS')
9. **BE** → **BE**: Lưu `startTime` vào In-Memory Cache (`time-barrier-cache.js`) — key: `${userId}_${surveyId}`
10. **BE** → **FE**: Response: `{ success: true, data: { sessionId, startTime, estimatedTime, formUrl } }`
11. **FE** → **FE**: Mở `formUrl` (Google Forms) trong **Tab mới** (`window.open`)
12. **FE** → **FE**: Tab hiện tại chuyển sang trang `/surveys/:id/submit` — hiển thị:
    - Đồng hồ đếm ngược (CountdownTimer) dựa trên `estimatedTime`
    - Ô nhập Completion Code (disabled cho đến khi hết đếm ngược)
    - Nút "Nộp mã" (disabled)

### Luồng lỗi

- **Bước 7 — Vượt quá giới hạn đồng thời:** BE ném `ForbiddenError("Bạn đang làm quá nhiều khảo sát cùng lúc")` → `403`
- **Bước 8 — Khảo sát đã hết slot:** BE ném `ConflictError("Khảo sát đã đủ số lượng phản hồi")` → `409`

---

## Flow 9: Nộp Completion Code & Nhận điểm (Code Submission + Pending Reward)

**Actors:** User (Respondent), FE, BE, DB

### Luồng chính

1. **User** → **FE**: Sau khi làm xong trên Google Forms, quay lại tab Rescom (`/surveys/:id/submit`)
2. **FE** → **FE**: Đồng hồ đếm ngược đã kết thúc → Ô nhập Code và nút "Nộp mã" được kích hoạt (enabled)
3. **User** → **FE**: Dán Completion Code vào ô nhập, bấm "Nộp mã"
4. **FE** → **BE**: `POST /api/v1/surveys/:surveyId/submit-code` — Body: `{ completionCode }`
5. **BE** → **BE**: Middleware chain: `authMiddleware → submitCodeValidator`
6. **BE** → **DB**: `surveyRepo.findById(surveyId)` — lấy thông tin khảo sát (completionCode gốc, estimatedTime, bounty)
7. **BE** → **BE**: So sánh `completionCode` từ request với `completionCode` trong DB
8. **BE** → **BE**: `timeTaken = NOW() - startTime` (lấy startTime từ In-Memory Cache hoặc DB SurveySession)
9. **BE** → **BE**: Kiểm tra Time Barrier: `timeTaken < estimatedTime`?

**Nếu Code đúng VÀ Time Barrier passed:**

10. **BE** → **DB**: Mở `prisma.$transaction`:
    - 10a. Trừ `escrowAmount` của Survey đi `bountyPerResponse`
    - 10b. Giảm `remainingSlots` của Survey đi 1 (nếu = 0 → chuyển status = 'COMPLETED')
    - 10c. `walletRepository.lockWalletByUserId(respondentUserId)` — `SELECT FOR UPDATE`
    - 10d. Tạo `LedgerEntry` (type = 'SUBMIT_SURVEY_REWARD', amount = +bounty, status = 'PENDING')
    - 10e. Cộng `pendingBalance` của Respondent thêm `bounty`
    - 10f. Cập nhật `SurveySession` status = 'COMPLETED'
11. **DB** → **BE**: Commit transaction thành công
12. **BE** → **BE**: Kiểm tra Onboarding: Đây có phải là khảo sát cộng đồng đầu tiên User hoàn thành không?
    - Nếu CÓ → `onboardingService.unlockStarterPoints(userId)`:
      - Mở transaction mới: Trừ 50 từ `pendingBalance` (LedgerEntry type 'STARTER_LOCKED_RELEASE' status change), Cộng 50 vào `cachedBalance` (LedgerEntry type 'STARTER_UNLOCKED')
      - Cập nhật `onboardingStep` = 'COMPLETED'
13. **BE** → **FE**: Response: `{ success: true, data: { pendingBalance, cachedBalance, starterUnlocked: true/false } }`
14. **FE** → **FE**: Hiệu ứng thành công: 🎉 Viền ô nhập sáng xanh Emerald, bounce animation. Toast thông báo "+X điểm đang chờ duyệt". RTK Query invalidate `'Wallet'`

### Luồng lỗi — Sai Code

- **Bước 7 — Code không khớp:**
  - **BE** → **DB**: `fraudDetectionService.logWrongCode(userId, surveyId)` — Ghi bản ghi vào bảng `FraudLog`
  - **BE** → **FE**: `BadRequestError("Mã hoàn thành không chính xác")` → `400`
  - **FE** → **FE**: Ô nhập rung lắc (shake animation), viền đỏ

### Luồng lỗi — Time Barrier vi phạm

- **Bước 9 — Làm quá nhanh (`timeTaken < estimatedTime`):**
  - **BE** → **DB**: `fraudDetectionService.logTimeBarrierViolation(userId, surveyId, timeTaken, estimatedTime)` — Ghi `FraudLog`
  - **BE** → **FE**: `ForbiddenError("Thời gian làm bài quá ngắn. Hệ thống ghi nhận vi phạm.")` → `403`
  - **FE** → **FE**: Dialog Modal hiện lên giải thích lý do bị từ chối, không đổ lỗi. Ô nhập rung lắc đỏ

---

## Flow 10: Tự động Đối soát Pending Balance (Settlement Cron Job)

**Actors:** Cron Job, BE, DB

### Luồng chính

1. ⚡ **Cron Job** chạy định kỳ (ví dụ: mỗi 1 giờ)
2. **Cron Job** → **DB**: Lấy Database Advisory Lock — `SELECT pg_try_advisory_lock(SETTLEMENT_LOCK_ID)`. Nếu đã có instance khác đang chạy → thoát ngay
3. **Cron Job** → **DB**: Tìm tất cả `LedgerEntry` có:
   - `status = 'PENDING'`
   - `createdAt + 48 giờ <= NOW()`
   - KHÔNG bị đánh dấu `DISPUTED`
4. **DB** → **Cron Job**: Trả danh sách các giao dịch đủ điều kiện
5. **Cron Job** lặp qua từng giao dịch:
   - 5a. **Cron Job** → **DB**: Mở `prisma.$transaction`:
     - Khóa dòng Wallet (`SELECT FOR UPDATE`)
     - Trừ `pendingBalance` đi `amount`
     - Cộng `cachedBalance` thêm `amount`
     - Cập nhật `LedgerEntry.status` = 'COMPLETED' (đã thanh toán)
   - 5b. **DB** → **Cron Job**: Commit transaction
6. **Cron Job** → **DB**: Giải phóng Advisory Lock — `SELECT pg_advisory_unlock(SETTLEMENT_LOCK_ID)`
7. **Cron Job**: Log số lượng giao dịch đã xử lý

---

## Flow 11: Tự động Hoàn tiền Khảo sát Hết hạn (Expired Survey Refund Cron Job)

**Actors:** Cron Job, BE, DB

### Luồng chính

1. ⚡ **Cron Job** chạy định kỳ (ví dụ: mỗi 1 giờ)
2. **Cron Job** → **DB**: Lấy Database Advisory Lock (khác key với Settlement Lock)
3. **Cron Job** → **DB**: Tìm tất cả Survey có `status = 'ACTIVE'` VÀ `expiresAt <= NOW()`
4. **DB** → **Cron Job**: Trả danh sách khảo sát đã hết hạn
5. **Cron Job** lặp qua từng khảo sát:
   - 5a. Tính `refundAmount = remainingSlots × bountyPerResponse` (số lượng chưa có người làm)
   - 5b. **Cron Job** → **DB**: Mở `prisma.$transaction`:
     - Cập nhật `Survey.status` = 'EXPIRED'
     - Khóa dòng Wallet của Publisher (`SELECT FOR UPDATE`)
     - Cộng `cachedBalance` của Publisher thêm `refundAmount`
     - Tạo `LedgerEntry` (type = 'ESCROW_REFUND', amount = +refundAmount, status = 'COMPLETED')
   - 5c. **DB** → **Cron Job**: Commit transaction
6. **Cron Job** → **DB**: Giải phóng Advisory Lock

---

## Flow 12: Publisher Xem Khảo sát Của Mình (My Surveys)

**Actors:** User (Publisher), FE, BE, DB

### Luồng chính

1. **User** → **FE**: Truy cập trang `/surveys/my`
2. **FE** → **BE**: `GET /api/v1/surveys/my?page=1&pageSize=20` — Cookie chứa JWT
3. **BE** → **BE**: authMiddleware → trích xuất userId
4. **BE** → **DB**: Truy vấn tất cả Survey có `publisherId = userId`, kèm theo:
   - Tổng số phản hồi đã nhận (completedResponses)
   - Số escrow còn lại
   - Danh sách các `SurveySession` đã COMPLETED (kèm userId respondent) — cho chức năng Report Fraud
5. **DB** → **BE**: Trả danh sách
6. **BE** → **FE**: Response: `{ success: true, data: [mySurveys], meta: {...} }`
7. **FE** → **FE**: Render danh sách MySurveyCard, mỗi card hiển thị:
   - Trạng thái (ACTIVE / EXPIRED / COMPLETED)
   - Tiến độ (ví dụ: 15/50 phản hồi)
   - Nút "Report Fraud" cho từng respondent (nếu giao dịch đang ở PENDING)

---

## Flow 13: Báo cáo Gian lận — Report Fraud (Dispute)

**Actors:** User (Publisher), FE, BE, DB

### Luồng chính

1. **User (Publisher)** → **FE**: Trên trang `/surveys/my`, bấm "Report Fraud" bên cạnh tên một Respondent cụ thể
2. **FE** → **FE**: Hiện Dialog xác nhận: "Bạn có chắc muốn báo cáo gian lận cho phản hồi này?"
3. **User** → **FE**: Bấm "Xác nhận"
4. **FE** → **BE**: `POST /api/v1/surveys/:surveyId/dispute` — Body: `{ respondentUserId, reason }`
5. **BE** → **BE**: authMiddleware → trích xuất userId (Publisher)
6. **BE** → **DB**: Kiểm tra:
   - Survey thuộc về Publisher (publisherId = userId)
   - Giao dịch `LedgerEntry` của Respondent cho survey này có `status = 'PENDING'` (chưa quá 48h)
7. **BE** → **DB**: Cập nhật `LedgerEntry.status` = 'DISPUTED'
8. **BE** → **DB**: Tạo bản ghi `DisputeTicket` (publisherId, respondentUserId, surveyId, reason, status = 'OPEN')
9. **DB** → **BE**: OK
10. **BE** → **FE**: Response: `{ success: true, data: { disputeId, status: 'OPEN' } }`
11. **FE** → **FE**: Cập nhật giao diện: Respondent bị đánh dấu "Đang bị khiếu nại" với badge màu đỏ

### Luồng lỗi

- **Bước 6 — Đã quá 48h:** Giao dịch đã được settlement rồi → BE ném `ConflictError("Thời hạn khiếu nại đã hết")` → `409`
- **Bước 6 — Survey không thuộc Publisher:** BE ném `ForbiddenError` → `403`

---

## Flow 14: Admin Xử lý Khiếu nại (Dispute Resolution)

**Actors:** Admin, FE, BE, DB

### Luồng chính — Xác nhận Gian lận

1. **Admin** → **FE**: Truy cập trang `/admin/disputes`
2. **FE** → **BE**: `GET /api/v1/admin/disputes?status=OPEN` — Cookie chứa JWT (Admin role)
3. **BE** → **BE**: authMiddleware → adminGuard (kiểm tra `role = 'ADMIN'`)
4. **BE** → **DB**: Truy vấn tất cả `DisputeTicket` có status = 'OPEN', kèm thông tin Publisher, Respondent, Survey
5. **BE** → **FE**: Trả danh sách disputes
6. **Admin** xem xét bằng chứng (đối chiếu data Google Sheets)
7. **Admin** → **FE**: Bấm "Xác nhận Gian lận" trên một dispute cụ thể
8. **FE** → **BE**: `POST /api/v1/admin/disputes/:disputeId/resolve` — Body: `{ resolution: 'FRAUD_CONFIRMED' }`
9. **BE** → **DB**: Mở `prisma.$transaction`:
   - 9a. Cập nhật `DisputeTicket.status` = 'RESOLVED_FRAUD'
   - 9b. Khóa Wallet của Respondent (kẻ gian lận) — `SELECT FOR UPDATE`
   - 9c. Trừ `pendingBalance` (hoặc `cachedBalance` nếu đã settle) đi số điểm bounty
   - 9d. Tạo `LedgerEntry` cho Respondent (type = 'DISPUTE_REFUND', amount = -bounty)
   - 9e. Khóa Wallet của Publisher — `SELECT FOR UPDATE`
   - 9f. Cộng `cachedBalance` của Publisher thêm bounty (hoàn trả)
   - 9g. Tạo `LedgerEntry` cho Publisher (type = 'DISPUTE_REFUND', amount = +bounty)
   - 9h. Nếu `cachedBalance` của Respondent < 0 → đánh dấu tài khoản bị khóa
10. **DB** → **BE**: Commit transaction
11. **BE** → **FE**: Response: `{ success: true, data: { resolution: 'FRAUD_CONFIRMED' } }`

### Luồng phụ — Bác bỏ Gian lận

7b. **Admin** → **FE**: Bấm "Bác bỏ" trên dispute
8b. **FE** → **BE**: `POST /api/v1/admin/disputes/:disputeId/resolve` — Body: `{ resolution: 'FRAUD_REJECTED' }`
9b. **BE** → **DB**:
   - Cập nhật `DisputeTicket.status` = 'RESOLVED_REJECTED'
   - Cập nhật `LedgerEntry.status` = 'PENDING' (cho phép settlement Cron Job xử lý lại bình thường)
10b. **BE** → **FE**: Response: `{ success: true, data: { resolution: 'FRAUD_REJECTED' } }`

---

## Flow 15: Xem Lịch sử Ví & Ước tính VND (Wallet History)

**Actors:** User, FE, BE, DB

### Luồng chính

1. **User** → **FE**: Truy cập trang `/wallet`
2. **FE** → **BE**: `GET /api/v1/wallet/balance` — Cookie chứa JWT
3. **BE** → **DB**: Truy vấn `Wallet` của User (cachedBalance, pendingBalance)
4. **BE** → **DB**: Truy vấn `SystemSetting` để lấy `POINT_TO_VND_RATE`
5. **BE** → **FE**: Response: `{ success: true, data: { cachedBalance, pendingBalance, vndRate } }`
6. **FE** → **FE**: Hiển thị số dư, tính toán giá trị VND ước tính = cachedBalance × vndRate
7. **FE** → **BE**: `GET /api/v1/wallet/history?page=1&pageSize=20`
8. **BE** → **DB**: Truy vấn `LedgerEntry` của User, sắp xếp theo createdAt DESC
9. **BE** → **FE**: Response: `{ success: true, data: [ledgerEntries], meta: {...} }`
10. **FE** → **FE**: Render danh sách TransactionItem, mỗi item hiển thị: loại giao dịch, số điểm (+ hoặc -), trạng thái (PENDING/COMPLETED/DISPUTED), thời gian

---

## Flow 16: Admin Cấu hình Tỷ giá VND (System Settings)

**Actors:** Admin, FE, BE, DB

### Luồng chính

1. **Admin** → **FE**: Truy cập trang `/admin/settings`
2. **FE** → **BE**: `GET /api/v1/admin/settings` — lấy cấu hình hiện tại
3. **BE** → **DB**: Truy vấn `SystemSetting` (POINT_TO_VND_RATE)
4. **BE** → **FE**: Response: `{ success: true, data: { pointToVndRate: 1000 } }`
5. **Admin** → **FE**: Nhập tỷ giá mới (ví dụ: 1500) và bấm "Lưu"
6. **FE** → **BE**: `PUT /api/v1/admin/settings` — Body: `{ pointToVndRate: 1500 }`
7. **BE** → **BE**: authMiddleware → adminGuard
8. **BE** → **DB**: Cập nhật `SystemSetting.POINT_TO_VND_RATE = 1500`
9. **BE** → **FE**: Response: `{ success: true }`
10. **FE** → **FE**: Toast thông báo "Đã cập nhật tỷ giá". Giá trị VND trên mọi trang Wallet của tất cả User sẽ tự động cập nhật khi họ reload hoặc RTK Query refetch

---

## Flow 17: Respondent Xem Lịch sử Khảo sát Đã Tham gia (Survey History)

**Actors:** User (Respondent), FE, BE, DB

### Luồng chính

1. **User** → **FE**: Truy cập trang `/surveys/history`
2. **FE** → **BE**: `GET /api/v1/surveys/history?page=1&pageSize=20`
3. **BE** → **DB**: Truy vấn tất cả `SurveySession` có `respondentId = userId`, JOIN với Survey và LedgerEntry để lấy trạng thái giao dịch
4. **DB** → **BE**: Trả danh sách
5. **BE** → **FE**: Response: `{ success: true, data: [surveyHistories], meta: {...} }`
6. **FE** → **FE**: Render danh sách SurveyHistoryCard, mỗi card hiển thị:
   - Tên khảo sát
   - Ngày tham gia
   - Số điểm nhận được
   - Trạng thái: 🕐 Đang chờ (PENDING) | ✅ Đã nhận (COMPLETED) | ⚠️ Đang bị khiếu nại (DISPUTED)

---

## Flow 18: Mở khóa Starter Points (Onboarding Completion)

**Actors:** System (tự động trigger trong Flow 9)

### Điều kiện kích hoạt

Flow này tự động xảy ra bên trong **Flow 9 (Bước 12)** khi Respondent hoàn thành **khảo sát cộng đồng đầu tiên** sau khi đã cập nhật nhân khẩu học.

### Luồng chi tiết

1. **BE** → **DB**: Kiểm tra `onboardingStep` của User hiện tại
2. Nếu `onboardingStep = 'DEMOGRAPHIC_SURVEY'` (đã điền profile, chưa hoàn thành khảo sát đầu tiên):
3. **BE** → **DB**: Mở `prisma.$transaction`:
   - 3a. Khóa Wallet (`SELECT FOR UPDATE`)
   - 3b. Tìm `LedgerEntry` ban đầu (type = 'STARTER_LOCKED_RELEASE', status = 'PENDING')
   - 3c. Cập nhật LedgerEntry.status = 'COMPLETED'
   - 3d. Trừ `pendingBalance` đi 50
   - 3e. Cộng `cachedBalance` thêm 50
   - 3f. Tạo `LedgerEntry` mới (type = 'STARTER_UNLOCKED', amount = +50, status = 'COMPLETED')
   - 3g. Cập nhật `User.onboardingStep` = 'COMPLETED'
4. **DB** → **BE**: Commit transaction
5. **BE**: Trả `starterUnlocked: true` trong response của Flow 9

---

## Tổng hợp: Ma trận API Endpoints ↔ Flows

| # | Endpoint | Method | Flow |
|---|---|---|---|
| 1 | `/api/v1/auth/register` | POST | Flow 1 |
| 2 | `/api/v1/auth/login` | POST | Flow 2 |
| 3 | `/api/v1/auth/refresh` | POST | Flow 3 |
| 4 | `/api/v1/auth/logout` | POST | Flow 4 |
| 5 | `/api/v1/profile/me/demographic` | POST | Flow 5 |
| 6 | `/api/v1/surveys` | GET | Flow 6 |
| 7 | `/api/v1/surveys` | POST | Flow 7 |
| 8 | `/api/v1/surveys/:id` | GET | Flow 8 |
| 9 | `/api/v1/surveys/:id/start` | POST | Flow 8 |
| 10 | `/api/v1/surveys/:surveyId/submit-code` | POST | Flow 9 |
| 11 | `/api/v1/surveys/my` | GET | Flow 12 |
| 12 | `/api/v1/surveys/:surveyId/dispute` | POST | Flow 13 |
| 13 | `/api/v1/admin/disputes` | GET | Flow 14 |
| 14 | `/api/v1/admin/disputes/:disputeId/resolve` | POST | Flow 14 |
| 15 | `/api/v1/wallet/balance` | GET | Flow 15 |
| 16 | `/api/v1/wallet/history` | GET | Flow 15 |
| 17 | `/api/v1/admin/settings` | GET/PUT | Flow 16 |
| 18 | `/api/v1/surveys/history` | GET | Flow 17 |
| — | Settlement Cron Job | — | Flow 10 |
| — | Expired Survey Refund Cron Job | — | Flow 11 |
| — | Starter Points Unlock (internal) | — | Flow 18 |
