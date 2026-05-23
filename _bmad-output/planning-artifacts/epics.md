---
stepsCompleted: [1, 2, 3]
inputDocuments: [
  "/Users/quan/HocTap/Vibecode/exe-prj/_bmad-output/planning-artifacts/prds/prd-exe-prj-2026-05-23/prd.md",
  "/Users/quan/HocTap/Vibecode/exe-prj/_bmad-output/planning-artifacts/architecture.md"
]
---

# Rescom - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Rescom, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Publish Survey with Escrow - System must allow user to publish a survey by defining a URL, target demographic, and point bounty. The total points (bounty * target response count) must be deducted from the user's balance and held in escrow.
- FR2: Claim Points via Completion Code - System must allow a user to submit a Completion Code for a survey. If the code matches and the Time Barrier check passes, the bounty is transferred from escrow to the user's balance.
- FR3: Locked Starter Points Protocol - System must grant 50 Locked Starter Points to new accounts. These points remain locked (unspendable) until the user completes the system demographic survey and exactly one community survey.
- FR4: Real-time Time Barrier - System must calculate timeTaken = endTime - startTime. If timeTaken < estimatedTime, system must reject the Completion Code submission, deny point transfer, and log the event to fraud_logs.
- FR5: Enforce Demographic Targeting - System must only display a published survey to users whose profiles match the publisher's defined demographic criteria.

### NonFunctional Requirements

- NFR1: Toàn vẹn giao dịch (Transaction Integrity) - Bắt buộc phải có ACID transactions và Row-Level Locking (SELECT FOR UPDATE) cho mọi giao dịch liên quan đến ví và quỹ escrow.
- NFR2: Bảo mật & Chống gian lận - Ghi log chi tiết các hành vi sai phạm, và áp dụng nguyên tắc Zero-Trust API (không bao giờ nhận point value từ frontend).
- NFR3: Khả năng bảo trì & Mở rộng - Phải tuân thủ chặt chẽ việc phân tách layer ở Backend (Controllers chỉ gọi Services, logic nằm ở Services).

### Additional Requirements

- Starter Template: Sử dụng kiến trúc Decoupled (Next.js TS cho Frontend, Express.js JS + Prisma cho Backend). Quan trọng cho quá trình setup.
- Đồng bộ hóa rào cản thời gian (Time Barrier UI): Giao diện Frontend phải có bộ đếm ngược và khóa nút "Submit Code" cho đến khi hết giờ.
- Hệ thống Khiếu nại (Dispute System): Điểm thưởng sau khi làm khảo sát sẽ nằm ở trạng thái `pendingBalance` chờ đối soát 48h. Người tạo khảo sát (Publisher) có nút "Report Fraud" để báo cáo gian lận.
- Sổ cái kép (Double-Entry Ledger): Phân tách `cachedBalance` và `pendingBalance` thông qua `LedgerEntry`. Mọi biến động ghi log giao dịch.
- Chống găm hàng (Hoarding Prevention): Giới hạn số lượng khảo sát làm cùng lúc và có thời gian tự động timeout giải phóng slot.

### UX Design Requirements

(Không có tài liệu UX Design cho MVP)

### FR Coverage Map

FR1: Epic 2 - Publish Survey with Escrow
FR2: Epic 3 - Claim Points via Completion Code
FR3: Epic 1 & Epic 3 - Locked Starter Points Protocol (Khởi tạo ở Epic 1, mở khóa ở Epic 3)
FR4: Epic 3 - Real-time Time Barrier
FR5: Epic 2 - Enforce Demographic Targeting

## Epic List

### Epic 1: User Onboarding & Core Wallet
Người dùng có thể đăng ký, thiết lập hồ sơ nhân khẩu học và theo dõi trạng thái Onboarding. Hệ thống thiết lập nền tảng Sổ cái kép (Double-Entry Ledger) và tự động cấp 50 Locked Starter Points ngay khi đăng ký. Bắt buộc tích hợp Database Seeding (Tạo dữ liệu mồi) để cung cấp sẵn tài khoản và khảo sát mẫu cho việc thử nghiệm các tính năng sau.
**FRs covered:** FR3

### Epic 2: Survey Publishing & Escrow
Người tạo khảo sát (Publisher) có thể đăng khảo sát với mục tiêu nhân khẩu học. Hệ thống tự động khóa điểm vào quỹ tạm giữ (Escrow). Người dùng có thể tìm các khảo sát khớp với hồ sơ của mình trên Marketplace (hiển thị mượt mà nhờ vào dữ liệu Seeding từ đầu).
**FRs covered:** FR1, FR5

### Epic 3: Survey Execution & Anti-Fraud
Người làm khảo sát tham gia với giao diện đồng hồ đếm ngược (Time Barrier UI). Nộp mã Code để chuyển điểm thưởng từ Escrow vào Pending Balance. Khởi chạy luồng hoàn tất mở khóa điểm Starter.
**FRs covered:** FR2, FR4

### Epic 4: Dispute System & Wallet History
Người dùng xem chi tiết lịch sử giao dịch ví. Hệ thống tự động chuyển điểm từ Pending thành Available sau 48h (Cron Job). Publisher có thể Báo cáo Data Rác (Report Fraud) để Admin thu hồi điểm.
**FRs covered:** (Giải quyết các Additional Requirements về Dispute Architecture và Wallet Management)

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic 1: User Onboarding & Core Wallet

Người dùng có thể đăng ký, thiết lập hồ sơ nhân khẩu học và theo dõi trạng thái Onboarding. Hệ thống thiết lập nền tảng Sổ cái kép (Double-Entry Ledger) và tự động cấp 50 Locked Starter Points ngay khi đăng ký. Đòi hỏi thiết lập Database Seeding.

### Story 1.1: Project Setup & Database Seeding

As a System Administrator,
I want khởi tạo nền tảng dự án và cấu trúc Database kèm dữ liệu mồi (Seed data),
So that team phát triển có môi trường chuẩn xác và dữ liệu giả lập để làm việc ngay lập tức.

**Acceptance Criteria:**

**Given** một thư mục dự án trống
**When** chạy lệnh khởi tạo và cấu hình
**Then** hệ thống tạo ra 2 thư mục độc lập: `frontend` (Next.js + TypeScript) và `backend` (Express.js + Node.js)
**And** Prisma Schema được định nghĩa đầy đủ các bảng thiết yếu: `User`, `Wallet`, `LedgerEntry`, `Survey`
**And** có một script `seed.js` khi chạy sẽ tự động chèn vào database ít nhất 20 user ảo và 50 khảo sát giả

### Story 1.2: User Authentication & Wallet Initialization

As a Người dùng mới,
I want đăng ký tài khoản bằng email/mật khẩu,
So that tôi có thể tham gia hệ thống và tự động nhận được 50 điểm khởi đầu.

**Acceptance Criteria:**

**Given** tôi là khách truy cập đang ở trang Đăng ký (Register Page)
**When** tôi nhập email, mật khẩu hợp lệ và bấm Đăng ký
**Then** tài khoản `User` của tôi được tạo thành công
**And** hệ thống tự động tạo một `Wallet` đi kèm với tài khoản của tôi
**And** hệ thống tự động tạo một giao dịch `LedgerEntry` cộng 50 điểm với loại giao dịch là 'STARTER_LOCKED_RELEASE' ở trạng thái `PENDING`
**And** tôi được đăng nhập thành công vào hệ thống thông qua HTTP-Only Cookie
**And** hệ thống chỉ cho phép đăng nhập trên 1 thiết bị duy nhất bằng cách lưu `currentSessionId` vào Database và Cookie, tự động vô hiệu hóa (401 Unauthorized) các thiết bị đăng nhập cũ.

### Story 1.3: Demographic Profile Update

As a Người dùng đã đăng ký,
I want cập nhật hồ sơ nhân khẩu học của mình (Chuyên ngành, Năm học, Độ tuổi),
So that hệ thống có thể phân phối cho tôi những bài khảo sát nhắm đúng đối tượng.

**Acceptance Criteria:**

**Given** tôi là người dùng đã đăng nhập nhưng chưa hoàn thiện hồ sơ
**When** tôi điền đầy đủ các thông tin nhân khẩu học hợp lệ trên giao diện Onboarding và bấm Lưu
**Then** dữ liệu nhân khẩu học của tôi được lưu thành công vào cơ sở dữ liệu
**And** trạng thái Onboarding của tôi được chuyển sang bước tiếp theo
**And** giao diện UI thông báo thành công và hiển thị thông tin cập nhật của tôi.

<!-- End Epic 1 -->

<!-- Next Epic Placeholder -->
## Epic 2: Survey Publishing & Escrow

Người tạo khảo sát (Publisher) có thể đăng khảo sát với mục tiêu nhân khẩu học. Hệ thống tự động khóa điểm vào quỹ tạm giữ (Escrow). Người dùng có thể tìm các khảo sát khớp với hồ sơ của mình trên Marketplace (hiển thị mượt mà nhờ vào dữ liệu Seeding từ đầu).

### Story 2.1: Survey Marketplace Feed & Demographic Filtering

As a Người làm khảo sát (Respondent),
I want xem danh sách các bài khảo sát đang hoạt động và phù hợp với hồ sơ của mình trên Marketplace,
So that tôi có thể dễ dàng chọn bài để kiếm điểm mà không mất thời gian vào những khảo sát không đúng đối tượng.

**Acceptance Criteria:**

**Given** tôi là người dùng đã đăng nhập và đã hoàn tất hồ sơ nhân khẩu học
**When** tôi truy cập vào trang Marketplace (Chợ Khảo sát)
**Then** hệ thống chỉ hiển thị danh sách các khảo sát có trạng thái là `ACTIVE` và chưa hết hạn (`expiresAt > now()`)
**And** các khảo sát hiển thị bắt buộc phải có mục tiêu nhân khẩu học (Major, Year, Age) khớp với hồ sơ của tôi (hoặc khảo sát không giới hạn nhân khẩu học)
**And** các khảo sát mà tôi đã hoàn thành rồi, hoặc đang trong thời gian làm dở dang, sẽ bị ẩn đi hoặc đánh dấu mờ
**And** trên mỗi thẻ (Card) khảo sát hiển thị rõ số Điểm thưởng và Thời gian làm dự kiến.

### Story 2.2: Survey Creation UI

As a Người tạo khảo sát (Publisher),
I want một giao diện Form để cấu hình khảo sát mới cùng các tiêu chí nhắm mục tiêu,
So that tôi có thể chỉ định chính xác ai là người được làm khảo sát và mức thưởng là bao nhiêu.

**Acceptance Criteria:**

**Given** tôi là người dùng có số dư khả dụng (Available Balance) lớn hơn 0
**When** tôi vào trang "Đăng khảo sát"
**Then** tôi có thể nhập link Google/Microsoft Forms, mã bí mật (Completion Code), thời gian làm dự kiến (phút), số lượng mẫu cần thu thập (responses count), điểm thưởng cho mỗi mẫu, và cài đặt Thời gian hết hạn (Expiration Time)
**And** tôi có thể chọn các bộ lọc nhân khẩu học
**And** giao diện sẽ tự động tính toán số điểm Tổng cần khóa vào quỹ (Tổng = số mẫu * điểm mỗi mẫu)
**And** hiển thị thông báo rõ ràng: "Số điểm không được sử dụng hết sau thời hạn này sẽ được tự động hoàn trả về ví của bạn"
**And** nút "Publish" sẽ bị vô hiệu hóa (disabled) nếu Tổng điểm vượt quá số dư hiện tại của tôi.

### Story 2.3: Escrow Deduction Transaction

As a Quản trị viên hệ thống (System Administrator),
I want quá trình đăng khảo sát phải trừ chính xác số tiền vào quỹ bằng Database Transaction,
So that nền kinh tế điểm không bị thủng do lỗi Race Condition (nhiều tab gửi request cùng lúc).

**Acceptance Criteria:**

**Given** một request đăng khảo sát hợp lệ từ Frontend gửi xuống
**When** Backend (Service Layer) xử lý request này
**Then** hệ thống mở một giao dịch Prisma `$transaction` và khóa dòng ví của user (`SELECT FOR UPDATE`)
**And** hệ thống kiểm tra lại lần cuối xem `cachedBalance >= total_escrow_points`
**And** nếu đủ tiền: hệ thống trừ `cachedBalance`, tạo một `LedgerEntry` (loại `PUBLISH_SURVEY_ESCROW`), và lưu bản ghi `Survey` mới vào DB
**And** nếu không đủ tiền, giao dịch tự động Rollback và trả về lỗi `BadRequestError` cho Frontend.

### Story 2.4: Expired Survey Escrow Auto-Refund

As a Quản trị viên hệ thống (System Administrator),
I want hệ thống tự động quét và thu hồi điểm tạm giữ của các khảo sát đã hết hạn,
So that người tạo khảo sát (Publisher) được hoàn lại số điểm từ những phiếu khảo sát không có người làm.

**Acceptance Criteria:**

**Given** có các khảo sát ở trạng thái `ACTIVE` nhưng thời gian hiện tại đã vượt qua `expiresAt`
**When** Cron Job định kỳ chạy trên hệ thống
**Then** hệ thống tìm tất cả các khảo sát đã hết hạn này
**And** chuyển trạng thái của chúng từ `ACTIVE` sang `EXPIRED`
**And** tính toán số lượng phiếu chưa có người làm
**And** tạo giao dịch `LedgerEntry` để hoàn trả số điểm tương ứng từ quỹ Escrow về `cachedBalance` của Publisher bằng Row-level locking
**And** Bắt buộc áp dụng cơ chế Database Lock (vd: pg_advisory_lock) để đảm bảo Cron Job không chạy trùng lặp khi deploy nhiều instance.

<!-- End Epic 2 -->

<!-- Next Epic Placeholder -->
## Epic 3: Survey Execution & Anti-Fraud

Người làm khảo sát tham gia với giao diện đồng hồ đếm ngược (Time Barrier UI). Nộp mã Code để chuyển điểm thưởng từ Escrow vào Pending Balance. Khởi chạy luồng hoàn tất mở khóa điểm Starter.

### Story 3.1: Survey Detail & Time Barrier Initiation

As a Người làm khảo sát (Respondent),
I want xem chi tiết khảo sát và nhấn nút "Bắt đầu làm",
So that hệ thống có thể ghi nhận mốc thời gian bắt đầu (start_time) của tôi để phục vụ cho tính năng đếm ngược.

**Acceptance Criteria:**

**Given** tôi đang xem chi tiết một bài khảo sát
**When** tôi nhấn nút "Bắt đầu Khảo sát"
**Then** Frontend gọi API `/start` xuống Backend
**And** Backend tạo một bản ghi `start_time` lưu vào Database PostgreSQL (bảng `SurveySession`) để đảm bảo dữ liệu không bị mất khi server restart
**And** Frontend mở link khảo sát (Google Forms) trong một Tab mới.

### Story 3.2: Time Barrier UI & Code Submission

As a Người làm khảo sát (Respondent),
I want thấy một đồng hồ đếm ngược trên màn hình nộp mã,
So that tôi biết khi nào mình được phép nộp Completion Code.

**Acceptance Criteria:**

**Given** tôi đã nhấn bắt đầu và quay lại tab của hệ thống Rescom
**When** tôi nhìn vào form nộp mã Completion Code
**Then** tôi thấy một đồng hồ đếm ngược đang chạy (dựa trên `estimatedTime` của khảo sát)
**And** nút "Nộp mã" (Submit) bị vô hiệu hóa (disabled)
**And** khi đồng hồ đếm ngược kết thúc, nút "Nộp mã" mới sáng lên cho phép tôi bấm.

### Story 3.3: Submission Validation & Pending Reward Transaction

As a Quản trị viên hệ thống (System Administrator),
I want Backend kiểm tra nghiêm ngặt mã Code và Thời gian làm bài,
So that chỉ những người làm bài tử tế (đủ thời gian) mới nhận được điểm treo (Pending) và mở khóa điểm khởi đầu.

**Acceptance Criteria:**

**Given** người dùng nộp một Completion Code từ Frontend
**When** Backend nhận được request
**Then** Backend kiểm tra mã Code có khớp với mã của bài khảo sát hay không
**And** Backend truy vấn bảng `SurveySession` để lấy `start_time`, từ đó tính toán `timeTaken` (thời gian đã trôi qua)
**And** nếu `timeTaken < estimatedTime`, giao dịch bị từ chối, trả về lỗi và ghi một bản ghi vào bảng `FraudLog`
**And** nếu hợp lệ, mở Database Transaction: trừ điểm Escrow của khảo sát, tạo `LedgerEntry` cộng điểm vào `pendingBalance` của User
**And** nếu đây là khảo sát đầu tiên user hoàn thành, hệ thống cập nhật trạng thái Onboarding, đồng thời tạo một giao dịch `LedgerEntry` (loại `STARTER_UNLOCKED`) để trừ 50 điểm ở `pendingBalance` và cộng 50 điểm vào `cachedBalance` (chính thức gỡ khóa).

<!-- End Epic 3 -->

<!-- Next Epic Placeholder -->
## Epic 4: Dispute System, Wallet Management & Admin Core

Người dùng xem chi tiết lịch sử giao dịch ví. Hệ thống tự động chuyển điểm từ Pending thành Available sau 48h (Cron Job). Publisher có thể Báo cáo Data Rác (Report Fraud) để Admin thu hồi điểm. Bổ sung Admin Dashboard để quản lý tỷ giá quy đổi VND.

### Story 4.1: Wallet History UI & VND Estimation

As a Người dùng,
I want xem lịch sử giao dịch điểm và giá trị quy đổi VND tương đương,
So that tôi biết điểm của mình đến từ đâu, tiêu vào đâu, và đáng giá bao nhiêu tiền thật.

**Acceptance Criteria:**

**Given** tôi truy cập vào trang Quản lý Ví (Wallet)
**When** dữ liệu ví được tải lên
**Then** hệ thống hiển thị Số dư Khả dụng (`cachedBalance`) và Số dư Đang chờ (`pendingBalance`)
**And** hệ thống hiển thị dòng chữ ước tính giá trị VND (VD: "~50.000 VND") bằng cách nhân số điểm với tỷ giá `POINT_TO_VND_RATE` lấy từ Backend
**And** hiển thị danh sách các biến động lịch sử (`LedgerEntry`) được sắp xếp theo thời gian mới nhất.

### Story 4.2: Pending Balance Settlement (Cron Job)

As a Quản trị viên hệ thống (System Administrator),
I want điểm thưởng bị treo (Pending) sẽ tự động chuyển thành khả dụng (Available) sau đúng 48 giờ nếu không có khiếu nại,
So that người dùng có thể nhận được điểm của mình mà không cần tôi duyệt tay.

**Acceptance Criteria:**

**Given** có các giao dịch trả điểm đang ở trạng thái `PENDING` và đã trôi qua 48 giờ
**When** Cron Job định kỳ (Settlement Job) chạy
**Then** hệ thống tìm các giao dịch này (trừ các giao dịch đang bị đánh dấu `DISPUTED`)
**And** tạo các giao dịch `LedgerEntry` mới để trừ đi số điểm `pendingBalance` và cộng đúng số điểm đó vào `cachedBalance`
**And** đánh dấu các giao dịch cũ là đã hoàn tất (SETTLED)
**And** Bắt buộc áp dụng cơ chế Database Lock để đảm bảo Cron Job không chạy trùng lặp khi deploy nhiều instance.

### Story 4.3: Survey Dispute & Fraud Reporting

As a Người tạo khảo sát (Publisher),
I want có thể báo cáo một người làm khảo sát gửi dữ liệu rác (spam) trong khoảng thời gian 48h chờ duyệt,
So that hệ thống tạm ngưng việc trả điểm cho người đó và chờ Admin xử lý.

**Acceptance Criteria:**

**Given** bài khảo sát của tôi có người vừa nộp mã và điểm đang ở trạng thái `PENDING` (chưa qua 48h)
**When** tôi kiểm tra dữ liệu, thấy dữ liệu rác và bấm "Report Fraud" trên ứng dụng Rescom
**Then** giao dịch trả điểm của người đó bị chuyển sang trạng thái `DISPUTED`
**And** Cron Job tự động (Story 4.2) sẽ bỏ qua giao dịch này, không chuyển thành Available
**And** một ticket khiếu nại được tạo ra để Admin xem xét thu hồi điểm.

### Story 4.4: Admin Dashboard & System Settings

As a Quản trị viên hệ thống (Admin),
I want một giao diện Admin để cấu hình tỷ giá quy đổi điểm sang VND,
So that tôi có thể linh hoạt thay đổi chính sách tỷ giá theo từng thời kỳ để kích thích người dùng.

**Acceptance Criteria:**

**Given** tôi là một User có phân quyền `role = 'ADMIN'`
**When** tôi truy cập vào trang Admin Settings
**Then** tôi nhìn thấy form hiển thị tỷ giá hiện tại (`POINT_TO_VND_RATE` từ bảng `SystemSetting`)
**And** tôi có thể nhập một tỷ giá mới và nhấn Lưu
**And** giao diện Ví người dùng lập tức cập nhật giá trị ước tính VND dựa trên tỷ giá mới này.

<!-- End Epic Breakdown -->
