---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: [
  "/Users/quan/HocTap/Vibecode/exe-prj/_bmad-output/planning-artifacts/prds/prd-exe-prj-2026-05-23/prd.md",
  "/Users/quan/HocTap/Vibecode/exe-prj/_bmad-output/planning-artifacts/briefs/brief-exe-prj-2026-05-23/brief.md",
  "/Users/quan/HocTap/Vibecode/exe-prj/_bmad-output/project-context.md"
]
workflowType: 'architecture'
project_name: 'exe-prj'
user_name: 'Quan'
date: '2026-05-23'
lastStep: 8
status: 'complete'
completedAt: '2026-05-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Hệ thống là một nền kinh tế điểm (Point Economy) cho việc trao đổi khảo sát. Các chức năng cốt lõi bao gồm:
1. Đăng khảo sát và trừ điểm vào quỹ tạm giữ (Escrow).
2. Trả điểm từ quỹ tạm giữ sang ví người dùng thông qua mã hoàn thành (Completion Code).
3. Hệ thống điểm thưởng ban đầu bị khóa (Locked Starter Points) cho đến khi hoàn thành các bước onboarding.
4. Kiểm tra rào cản thời gian (Time Barrier) để chống bot/gian lận.
5. Lọc và hiển thị khảo sát dựa trên hồ sơ nhân khẩu học (Demographic Targeting).

**Non-Functional Requirements:**
- **Toàn vẹn giao dịch (Transaction Integrity):** Bắt buộc phải có ACID transactions cho mọi thay đổi về số dư điểm và quỹ tạm giữ.
- **Bảo mật & Chống gian lận:** Ghi log chi tiết các hành vi gian lận (fraud_logs) và giới hạn quyền truy cập dựa trên tiến độ onboarding.
- **Khả năng duy trì & Mở rộng:** Backend phải tuân thủ nghiêm ngặt việc tách biệt logic nghiệp vụ ra các `services` và quản lý lỗi tập trung (theo quy định của project-context).

**Scale & Complexity:**
Dự án nhắm đến đối tượng ban đầu là sinh viên FPT Đà Nẵng (~500 users active/tháng đầu), với thanh khoản cao trên marketplace.

- Primary domain: Web Full-stack (Node.js/Express Backend)
- Complexity level: Medium (Do yêu cầu cao về logic ví điểm và transaction)
- Estimated architectural components: ~4-5 core modules (Users/Profiles, Surveys, Ledger/Transactions, Fraud/Audit Logs, Auth).

### Technical Constraints & Dependencies

- Bắt buộc dùng Node.js, Express (`^5.2.1`).
- V1 không có Form Builder nội bộ, chỉ tích hợp link Google/Microsoft Forms.
- Mã xác nhận (Completion Code) là mã tĩnh cho V1, phụ thuộc vào Time Barrier để ngăn gian lận.
- Rút tiền thật (Fiat withdrawal) được xử lý thủ công bằng admin, chưa tích hợp cổng thanh toán trong V1.

### Cross-Cutting Concerns Identified

- **Transaction & Escrow Management:** Phải được xử lý đồng bộ và an toàn, là trái tim của hệ thống.
- **Centralized Error & Success Handling:** Cần thiết lập thư mục `core` ở backend để chuẩn hóa response.
- **Audit & Fraud Logging:** Mọi hành động bất thường (nhập sai mã, thời gian làm quá nhanh) đều phải được lưu trữ.
- **Demographic Filtering Engine:** Cần một cơ chế query CSDL hiệu quả để matching user profiles với điều kiện khảo sát.

### Key Architectural Decisions (Initial Insights & Enhanced Elicitation)

- **Database Paradigm:** Bắt buộc sử dụng Cơ sở dữ liệu quan hệ (RDBMS như PostgreSQL hoặc MySQL) thay vì NoSQL. Việc này nhằm đảm bảo tính toàn vẹn của nền kinh tế điểm (Point Economy) thông qua Row-level locking và ACID transactions.
- **Demographic Engine:** Không sử dụng Search Engine phức tạp (Elasticsearch) cho MVP. Việc matching sẽ dựa vào SQL query với Indexes được tối ưu hóa trên các trường nhân khẩu học chính.
- **State Management & Anti-Fraud:** Trạng thái đang làm khảo sát (`start_time` cho Time Barrier) nên được xử lý trên Cache (như Redis) để giảm tải Database Write, trong khi đó Log gian lận (`fraud_logs`) phải được ghi thẳng vào RDBMS.
- **Time Barrier UI/UX Synchronization (Đồng bộ Rào cản thời gian):**
  - *Vấn đề (Problem):* Luồng sử dụng Google Forms (chuyển tab) kết hợp phạt gian lận (Time Barrier) có thể gây ức chế lớn nếu người dùng nộp mã sớm do vô tình.
  - *Giải pháp (Solution):* Áp dụng "Khóa Submit Frontend" (Frontend Submit Lock). Giao diện UI/UX phải hiển thị đồng hồ đếm ngược (dựa trên `estimated_time`). Nút Submit Code bị vô hiệu hóa cho đến khi đếm ngược kết thúc để giáo dục người dùng. Backend vẫn phải duy trì lớp kiểm tra tính toán thời gian thực tế để chống API Abuse.
- **Data Integrity & Dispute Architecture (Cơ chế Khiếu nại và Thu hồi điểm):**
  - *Sự thật cốt lõi:* Với Google Forms và Mã xác nhận tĩnh ở V1, Rescom hoàn toàn "mù" trước hành vi chia sẻ mã. Rào cản thời gian không ngăn được hành vi này.
  - *Giải pháp kiến trúc:* 
    1. **Theo dõi nhấp chuột (Click Tracking):** Rescom bắt buộc phải tracking xem user có thực sự click vào link chuyển hướng sang Google Forms hay không, làm điều kiện cần.
    2. **Cơ chế Khiếu nại (Dispute System) & Giao dịch treo (Pending Transactions):** Khi user nộp mã thành công, điểm KHÔNG được cộng ngay lập tức vào số dư khả dụng (Available Balance) mà phải nằm ở trạng thái **"Chờ đối soát" (Pending)** trong ví dụ 24-48 giờ. 
    3. Người tạo khảo sát (Publisher) được cung cấp một nút "Báo cáo Data Rác" (Report Fraud). Nếu họ đối chiếu file Google Sheets và phát hiện gian lận, họ có thể khiếu nại để admin hoàn trả (Refund) điểm bị farm trái phép từ ví Pending của kẻ gian lận về lại quỹ Escrow.
- **Security & Audit Protocols (Bảo mật và Kiểm toán):**
  - *Chống tấn công tương tranh (Race Conditions):* Bắt buộc áp dụng Database Transactions với cơ chế Row-level locking (`SELECT FOR UPDATE`) cho mọi tương tác làm thay đổi số dư ví và quỹ Escrow.
  - *Quy tắc Payload (Zero-Trust API):* Backend tuyệt đối không nhận tham số quyết định giá trị điểm (point value) từ client-side. Hệ thống phải tự truy vấn gốc từ DB thông qua ID.
  - *Chống găm hàng (Hoarding Prevention):* Giới hạn số lượng khảo sát đang làm cùng lúc (Concurrent Starts Limit) và áp dụng cơ chế tự động giải phóng slot (Slot Timeout) nếu user không nộp mã trong thời gian quy định.
  - *Sổ cái kép (Double-Entry Bookkeeping):* Mọi biến động điểm phải tạo ra log giao dịch đối ứng (sender/receiver). Xây dựng một tác vụ ngầm (Cron job) đối soát tổng cung tiền (total point supply) định kỳ mỗi đêm để rà soát lạm phát hoặc lỗi logic.

## Starter Template Evaluation

### Primary Technology Domain

Web Application (Decoupled Fullstack) dựa trên phân tích yêu cầu nghiệp vụ của Rescom.

### Starter Options Considered

1. **Option A: Next.js Monolith (App Router + Prisma)**
   - *Ưu điểm:* Tốc độ phát triển nhanh, một codebase duy nhất dễ quản lý cấu hình.
   - *Nhược điểm:* Rất khó cưỡng chế quy tắc phân tách ngôn ngữ (chỉ sử dụng TypeScript cho Frontend, JavaScript cho Backend) vì dùng chung một build system. Không tối ưu cho việc tổ chức code theo mô hình Clean Code chia tầng độc lập cho Backend.

2. **Option B: Decoupled Architecture (Next.js Frontend + Express.js Backend) [Đã chọn]**
   - **Frontend:** Next.js (`latest`), TypeScript, Tailwind CSS, Redux Toolkit (RTK) quản lý state.
   - **Backend:** Express.js (`^5.2.1`), ES6+ JavaScript, Prisma ORM, PostgreSQL.
   - *Ưu điểm:* Phân tách rạch ròi giữa hai tầng giao diện và logic. Phù hợp hoàn hảo với ràng buộc kỹ thuật đề ra. Hỗ trợ việc tổ chức cấu trúc mã nguồn theo Clean Code và Single Responsibility Principle (SRP) ở Backend một cách tự nhiên.

### Selected Starter: Decoupled Next.js (TS + Tailwind + Redux) & Express (JS + Prisma + PostgreSQL)

**Rationale for Selection:**
- **Ràng buộc công nghệ:** Tách biệt rõ ràng Frontend (TS) và Backend (JS) trong hai thư mục độc lập với package.json riêng.
- **Khả năng mở rộng trạng thái (Redux Toolkit):** RTK giúp quản lý các state phức tạp trên Frontend (như thời gian thực của Time Barrier, số dư ví ảo tạm tính, dữ liệu khảo sát được tải từ backend) một cách nhất quán, dễ debug và bảo trì khi quy mô hệ thống tăng lên.
- **Tập trung vào Clean Code & SRP ở Backend:** Tách biệt tuyệt đối các tầng xử lý của Express:
  - **Routes Layer:** Chỉ ánh xạ endpoint và nhận diện tham số.
  - **Validation Layer (SRP):** Mỗi middleware/hàm chỉ chịu trách nhiệm validate một nhóm tham số nhất định.
  - **Services Layer (SRP):** Mỗi dịch vụ nghiệp vụ (như `deductEscrowPoints`, `validateTimeBarrier`, `processCompletionCode`) là một hàm riêng biệt chỉ thực hiện đúng một logic nghiệp vụ chuyên biệt. Không trộn lẫn logic DB hay định dạng phản hồi.
  - **Repositories/Prisma Layer (SRP):** Tách riêng các hàm truy vấn DB ra các helper module riêng biệt.
  - **Core Success/Error Helper:** Standardize response thành một hàm duy nhất đặt trong thư mục `core`.

**Initialization Command:**

**Frontend Setup (Thư mục `/frontend`):**
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd frontend
npm install @reduxjs/toolkit react-redux
```

**Backend Setup (Thư mục `/backend`):**
```bash
mkdir backend
cd backend
npm init -y
npm install express@^5.2.1 prisma @prisma/client
npm install --save-dev nodemon@^3.1.14
npx prisma init
```

**Architectural Decisions Provided by Starter:**

- **Language & Runtime:** Frontend chạy trên Node.js runtime biên dịch TypeScript sang JS; Backend chạy ES6+ JavaScript thuần túy trên Node.js.
- **Styling Solution:** Tailwind CSS cho giao diện hiện đại, tối ưu hóa CSS bundle tự động.
- **Build Tooling:** Next.js Compiler (SWC) cho Frontend, nodemon giám sát phát triển cho Backend.
- **State Management:** Redux Toolkit cung cấp một Store duy nhất, chia cắt thành các Slice chuyên biệt (auth slice, wallet slice, survey slice).
- **Code Organization (Backend SRP):** 
  - `src/core/`: Chứa global error middleware và generic API formatter.
  - `src/controllers/`: Mỗi controller chỉ parse dữ liệu từ request và gọi Service thích hợp.
  - `src/services/`: Tập hợp các pure business functions (mỗi hàm đảm nhận đúng 1 nhiệm vụ).
  - `src/repositories/`: Nơi thực thi Prisma DB operations cô lập.

*Lưu ý:* Việc khởi tạo dự án bằng các lệnh trên sẽ là Story phát triển đầu tiên trong Sprint Backlog.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Mô hình Ví điểm (Wallet & Ledger) với cơ chế chống Race Condition
- Xác thực JWT qua HTTP-Only Cookie
- Chuẩn hóa API Response & Centralized Error Handling
- Cơ chế Pending Balance 48h cho Dispute System

**Important Decisions (Shape Architecture):**
- Sử dụng Zod cho Data Validation cả FE và BE
- RTK Query làm Data Fetching Layer chính
- Chiến lược Caching cho Time Barrier (In-Memory V1)

**Deferred Decisions (Post-MVP):**
- Redis thay thế In-Memory Cache khi scale multi-instance
- CI/CD Pipeline chi tiết (GitHub Actions)
- Monitoring & Logging nâng cao (ELK Stack / Sentry)

### Data Architecture

**Database:** PostgreSQL (Prisma ORM `@prisma/client`)
- *Rationale:* Bắt buộc cho ACID Transactions, Row-level Locking (`SELECT FOR UPDATE`), và tính toàn vẹn của nền kinh tế điểm.
- *Migration:* Sử dụng Prisma Migrate mặc định.

**Data Validation:** Zod (`^4.4.3`)
- *Rationale:* Zod hoạt động tốt trên cả TypeScript (Frontend) và JavaScript (Backend). Định nghĩa schema validate ở tầng Controller/Middleware trước khi dữ liệu đi vào Service Layer. Đảm bảo đồng bộ cấu trúc validate giữa FE và BE.

**Caching Strategy (V1):** In-Memory Cache (Map hoặc `lru-cache`)
- *Rationale:* Lưu `start_time` của phiên làm khảo sát cho Time Barrier. Giảm chi phí hạ tầng ở MVP. Dễ dàng nâng cấp lên Redis khi cần scale multi-instance.

**Mô hình Ví điểm (Wallet & Ledger - Party Mode Consensus):**

#### Nguyên tắc 1: Sổ cái bất biến (Immutable Double-Entry Ledger)
- Mọi biến động tài chính được ghi nhận dưới dạng một dòng giao dịch (Transaction Log) **không thể chỉnh sửa** trong bảng `LedgerEntry`.
- Available Balance (`cachedBalance`) của người dùng là kết quả phái sinh từ tổng các giao dịch. Trường `cachedBalance` trên bảng `Wallet` chỉ là bản sao tối ưu hóa hiệu năng đọc, **phải** được cập nhật đồng thời trong cùng một DB Transaction khi ghi nhận dòng Ledger mới.

#### Nguyên tắc 2: Khóa dòng dữ liệu (Row-Level Locking)
- Khi thay đổi số dư ví, bắt buộc dùng Pessimistic Locking (`SELECT * FROM "Wallet" WHERE "userId" = X FOR UPDATE`) trong `prisma.$transaction`.
- Mọi request song song đến cùng một ví sẽ bị serialize tự động bởi PostgreSQL.

#### Nguyên tắc 3: Phân tách Số dư Khả dụng & Số dư Treo
- `cachedBalance`: Số dư khả dụng thực tế, user có thể dùng để đăng khảo sát hoặc rút tiền.
- `pendingBalance`: Số dư đang treo chờ đối soát (48h). Điểm thưởng khi nhập Completion Code được cộng vào đây trước.
- Sau 48h không có khiếu nại từ Publisher, Cron Job tự động chuyển `pendingBalance` sang `cachedBalance`.
- Nếu Publisher khiếu nại thành công (Dispute), Admin thu hồi điểm từ `pendingBalance` hoặc `cachedBalance` của kẻ gian lận. Cho phép `cachedBalance` < 0 (số dư âm) và khóa tài khoản cho đến khi bổ sung đủ điểm.

#### Prisma Schema tham chiếu (Wallet & LedgerEntry)

```prisma
model Wallet {
  id             String        @id @default(uuid())
  userId         String        @unique
  cachedBalance  Int           @default(0)
  pendingBalance Int           @default(0)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  ledgerEntries  LedgerEntry[]
}

model LedgerEntry {
  id          String   @id @default(uuid())
  walletId    String
  wallet      Wallet   @relation(fields: [walletId], references: [id])
  amount      Int
  type        String   // 'SUBMIT_SURVEY_REWARD', 'PUBLISH_SURVEY_ESCROW', 'DISPUTE_REFUND', 'STARTER_LOCKED_RELEASE'
  status      String   // 'PENDING', 'COMPLETED', 'FAILED'
  referenceId String?
  createdAt   DateTime @default(now())
}
```

#### Backend SRP Implementation Pattern (Wallet Operations)

- `src/repositories/wallet.repository.js`: Các hàm DB thuần túy (`lockWalletByUserId`, `createLedgerEntry`, `updateWalletBalance`) — mỗi hàm chỉ làm đúng một truy vấn.
- `src/services/wallet.service.js`: Các hàm nghiệp vụ (`deductPointsForSurveyPublish`, `creditPendingReward`, `settleDisputeRefund`) — mỗi hàm orchestrate một luồng business logic duy nhất bên trong `prisma.$transaction`.
- `src/controllers/wallet.controller.js`: Parse request, gọi Service, trả response chuẩn hóa.

### Authentication & Security

**Authentication:** Stateless JWT (`jsonwebtoken` `^9.0.3`) qua HTTP-Only Cookie
- *Rationale:* Bảo mật hơn `localStorage` (chống XSS). Next.js có thể đọc Cookie ở cả Server Components và Client Components.
- *Token Strategy:* Access Token (ngắn hạn, 15 phút) + Refresh Token (dài hạn, 7 ngày) lưu trong HTTP-Only Cookie.

**API Security Middleware Stack:**
- `cors`: Giới hạn origin cho domain Frontend.
- `helmet`: Thiết lập HTTP headers bảo mật.
- `express-rate-limit` (`^8.5.2`): Giới hạn tần suất gọi API, đặc biệt cho endpoint nộp Completion Code để chống brute-force.

**Zero-Trust Payload Rule:**
- Backend tuyệt đối không nhận giá trị điểm (point value) từ client. Hệ thống tự truy vấn từ DB thông qua `surveyId`.

### API & Communication Patterns

**API Style:** RESTful API
- *Rationale:* Đơn giản, phổ biến, phù hợp với quy mô MVP (~500 users). Không cần GraphQL cho V1.

**Centralized Response Format:**
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "Mô tả lỗi", "code": "ERROR_CODE" } }
```

**Error Handling Architecture:**
- Service Layer ném Custom Error classes (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`).
- Global Error Middleware (`src/core/error-handler.js`) bắt tất cả lỗi, map sang HTTP status code và format response chuẩn.
- Không viết `try/catch` lặp đi lặp lại ở Controllers — mỗi Controller chỉ gọi Service và để lỗi tự bubble up tới middleware.

### Frontend Architecture

**State Management:** Redux Toolkit (RTK) + RTK Query
- *RTK Store:* Chia thành các Slice chuyên biệt: `authSlice`, `walletSlice`, `surveySlice`, `uiSlice`.
- *RTK Query:* Làm Data Fetching Layer chính. Tự động tạo hooks (`useGetSurveysQuery`, `useSubmitCodeMutation`), quản lý loading/error states, và hỗ trợ cache invalidation (ví dụ: sau khi nộp mã thành công, tự động refetch số dư ví).
- *SSR Integration:* Thiết lập `StoreProvider` client-side component riêng biệt, chỉ bọc các phần giao diện tương tác cần Redux state. Tránh bọc toàn bộ Root Layout.

**Component Architecture:** Atomic Design (Pages → Templates → Organisms → Molecules → Atoms)
- *Rationale:* Phù hợp với Next.js App Router. Tái sử dụng components cao, dễ bảo trì.

### Infrastructure & Deployment

**Hosting:**
- Frontend: Vercel (Tối ưu nhất cho Next.js, Free tier đủ cho MVP).
- Backend: Railway hoặc Render (Đơn giản, deploy Node.js Express từ GitHub).
- Database: Neon (Serverless PostgreSQL) hoặc Supabase PostgreSQL (Pooled connections tương thích Prisma).

**Environment Configuration:**
- Sử dụng `.env` files cho mỗi môi trường (development, staging, production).
- Biến môi trường nhạy cảm (DB URL, JWT Secret) chỉ được lưu trên hosting platform, tuyệt đối không commit vào Git.

**CI/CD (Deferred - Post-MVP):**
- GitHub Actions: Tự động chạy Unit Tests trước khi cho phép merge vào `main`.

### Decision Impact Analysis

**Implementation Sequence:**
1. Khởi tạo dự án (Frontend + Backend + Prisma Init)
2. Thiết lập Prisma Schema (Users, Wallet, LedgerEntry, Surveys, FraudLogs)
3. Xây dựng Core Backend (Error Handler, Response Formatter, Auth Middleware)
4. Xây dựng Wallet Service & Repository (Row-Level Locking)
5. Xây dựng Survey Service (Publish + Escrow + Demographic Matching)
6. Xây dựng Completion Code Service (Time Barrier + Pending Reward)
7. Thiết lập Redux Store & RTK Query ở Frontend
8. Xây dựng UI Pages (Auth, Dashboard, Survey Marketplace, Wallet)

**Cross-Component Dependencies:**
- Wallet & Ledger là nền tảng — Survey Service và Completion Code Service đều phụ thuộc vào nó.
- Auth Middleware phải hoàn thành trước mọi Service khác.
- RTK Query definitions ở Frontend phụ thuộc vào API endpoints đã ổn định ở Backend.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 13 areas where AI agents could make different choices (5 naming, 3 structural, 2 format, 3 process).

### Naming Patterns

**Database Naming (Prisma Schema):**
- Model: `PascalCase` — `User`, `Survey`, `LedgerEntry`, `FraudLog`
- Column: `camelCase` — `userId`, `cachedBalance`, `estimatedTime`
- Bảng trong PostgreSQL: Prisma tự map sang `"User"`, `"Survey"` — giữ nguyên PascalCase
- Foreign Key: `camelCase` theo tên model liên kết — `walletId`, `surveyId`
- Index: `@@index([fieldName], name: "idx_tablename_fieldname")`

**API Naming (REST Endpoints):**
- Danh từ số nhiều, kebab-case: `/api/v1/surveys`, `/api/v1/fraud-logs`
- Route param: `:id` (Express style) — `/api/v1/surveys/:id/submit-code`
- Query param: `camelCase` — `?pageSize=10&sortBy=createdAt`
- Version prefix: `/api/v1/...` cho mọi endpoint

**Code Naming:**

| Ngữ cảnh | Quy tắc | Ví dụ |
|---|---|---|
| Backend file | `kebab-case.js` | `wallet.service.js`, `error-handler.js` |
| Backend function/variable | `camelCase` | `deductPointsForSurveyPublish` |
| Backend class | `PascalCase` | `BadRequestError`, `UnauthorizedError` |
| Backend constants | `UPPER_SNAKE_CASE` | `MAX_CONCURRENT_SURVEYS`, `PENDING_PERIOD_HOURS` |
| Frontend component file | `PascalCase.tsx` | `SurveyCard.tsx`, `WalletBalance.tsx` |
| Frontend utility/hook | `camelCase.ts` | `useAuth.ts`, `formatPoints.ts` |
| Frontend Redux slice | `camelCase.ts` | `walletSlice.ts`, `authSlice.ts` |

### Structure Patterns

**Test Co-location:**
- Tests đặt cạnh file chúng test: `wallet.service.js` → `wallet.service.test.js`
- Frontend: `SurveyCard.tsx` → `SurveyCard.test.tsx`

**Backend Organization (by layer):**
```
backend/src/
├── core/                    # Cross-cutting: error-handler.js, response-formatter.js, auth-middleware.js
├── controllers/             # Parse request → gọi service → trả response
├── services/                # Pure business logic (SRP: mỗi hàm 1 nhiệm vụ)
├── repositories/            # Prisma DB operations cô lập
├── validators/              # Zod schemas cho request validation
├── routes/                  # Route definitions (chỉ ánh xạ endpoint)
├── constants/               # Shared enums & magic values (ledger-types.js, survey-status.js)
├── utils/                   # Shared helpers (date formatting, hashing, etc.)
├── config/                  # prisma.js (singleton), jwt.js, environment vars
└── app.js                   # Express app setup & middleware registration
```

**Frontend Organization (Atomic Design + Feature Slices):**
```
frontend/src/
├── app/                     # Next.js App Router (pages, layouts)
├── components/
│   ├── atoms/               # Button, Input, Badge, Spinner
│   ├── molecules/           # SearchBar, PointDisplay, CountdownTimer
│   ├── organisms/           # SurveyCard, WalletPanel, NavigationBar
│   └── templates/           # PageLayout, DashboardLayout
├── store/                   # Redux Toolkit
│   ├── store.ts
│   ├── provider.tsx         # StoreProvider (client component)
│   ├── slices/
│   └── api/                 # RTK Query API definitions
├── hooks/                   # Custom React hooks
├── utils/                   # Shared utilities
├── types/                   # TypeScript type definitions & enums (mirror backend constants)
└── lib/                     # Third-party config
```

### Format Patterns

**API Response (Chuẩn hóa):**
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "Mô tả lỗi", "code": "ERROR_CODE" } }

// Pagination
{ "success": true, "data": [...], "meta": { "page": 1, "pageSize": 20, "totalItems": 150, "totalPages": 8 } }
```

**JSON Field Naming:** `camelCase` (thống nhất với JavaScript/TypeScript conventions)

**Date Format:** ISO 8601 string (`2026-05-23T15:30:00.000Z`) — Prisma tự trả về format này

**Null Handling:** Trả `null` (không trả `""` hay `undefined`). Frontend kiểm tra `data?.field ?? fallback`

### Communication Patterns

**Redux Action Naming:** `domain/actionName` — `wallet/setBalance`, `auth/logout`, `survey/setFilter`

**RTK Query Tag Naming:** `PascalCase` entity name — `'Survey'`, `'Wallet'`, `'User'`

**Logging (Backend):**
- Level: `info` (API calls), `warn` (soft validation failures), `error` (unexpected crashes)
- Format: `[TIMESTAMP] [LEVEL] [MODULE] Message`
- Ví dụ: `[2026-05-23T15:30:00Z] [ERROR] [wallet.service] INSUFFICIENT_BALANCE for userId: abc123`
- Ghi vào bảng `FraudLog` cho các hành vi gian lận (Time Barrier violations, wrong Completion Codes)

### Process Patterns

**Error Handling Flow:**
1. Validator middleware bắt lỗi schema → ném `BadRequestError`
2. Service logic bắt lỗi nghiệp vụ → ném Custom Error tương ứng
3. Global Error Middleware bắt → map sang HTTP status → trả response chuẩn
4. **Không bao giờ** viết `try/catch` trong Controller

**Loading State (Frontend):**
- RTK Query tự quản lý `isLoading`, `isFetching`, `isError` cho mỗi query/mutation
- Sử dụng component `<Spinner />` atom cho trạng thái tải cục bộ
- Skeleton loading cho danh sách khảo sát (marketplace)

### Party Mode Enhancements (8 bổ sung)

#### 1. Module System: ES Modules
- Backend bắt buộc dùng **ES Modules** (`import/export`)
- Thêm `"type": "module"` vào `backend/package.json`
- Tất cả file dùng `import ... from '...'`, không dùng `require()`

#### 2. Middleware Chaining Order (Bắt buộc)
```
helmet → cors → express.json → rateLimiter → authMiddleware → validator → controller
```
Thứ tự này được cấu hình trong `app.js` và không được thay đổi.

#### 3. Express 5 Async Handling
- Express 5.x tự động forward rejected promises tới error middleware
- **KHÔNG cần** viết `asyncHandler` wrapper hay `try/catch` trong controller/route handler
- Lỗi từ `async` function tự động được Global Error Middleware xử lý

#### 4. Prisma Singleton Instance
- Tạo **MỘT** `PrismaClient` instance duy nhất tại `backend/src/config/prisma.js`
- Mọi repository/service import từ file này:
```javascript
// backend/src/config/prisma.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;
```

#### 5. Shared Constants (Enum Mirroring FE ↔ BE)
- Backend định nghĩa tất cả constants trong `backend/src/constants/`:
  - `ledger-types.js`: `SUBMIT_SURVEY_REWARD`, `PUBLISH_SURVEY_ESCROW`, `DISPUTE_REFUND`, `STARTER_LOCKED_RELEASE`
  - `ledger-status.js`: `PENDING`, `COMPLETED`, `FAILED`
  - `survey-status.js`: `DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `EXPIRED`
- Frontend tạo file mirror trong `frontend/src/types/enums.ts` với **cùng exact string values**
- Khi thêm giá trị mới ở BE, **bắt buộc** cập nhật file tương ứng ở FE

#### 6. HTTP Status Code Mapping (Bắt buộc)

| Custom Error | HTTP Code | Khi nào dùng |
|---|---|---|
| `BadRequestError` | `400` | Input validation thất bại |
| `UnauthorizedError` | `401` | Token hết hạn / không có token |
| `ForbiddenError` | `403` | Onboarding chưa hoàn thành / tài khoản bị khóa |
| `NotFoundError` | `404` | Resource không tồn tại |
| `ConflictError` | `409` | Duplicate submission / đã nộp mã rồi |
| `TooManyRequestsError` | `429` | Rate limit exceeded |
| Unhandled Error | `500` | Lỗi không xác định — ghi log chi tiết |

#### 7. End-to-End Request Flow Example (Nộp Completion Code)
```
[Request] POST /api/v1/surveys/:surveyId/submit-code
    ↓ helmet, cors, express.json, rateLimiter
    ↓ authMiddleware (verify JWT cookie → extract userId)
    ↓ submitCodeValidator (Zod: validate body { completionCode: string })
    ↓ surveyCompletionController.submitCode (parse params + body, gọi service)
    ↓ surveyCompletionService.processSubmission(userId, surveyId, code)
        ↓ surveyRepo.findById(surveyId) → kiểm tra survey tồn tại
        ↓ Kiểm tra Time Barrier (cache start_time)
        ↓ So sánh completionCode
        ↓ walletService.creditPendingReward(userId, pointReward, surveyId)
            ↓ prisma.$transaction → lockWallet → createLedgerEntry(PENDING) → updatePendingBalance
    ↓ Response: { success: true, data: { pendingBalance: 150 } }
```

#### 8. JSDoc Template Bắt buộc (Backend Services & Repositories)
```javascript
/**
 * Mô tả ngắn gọn chức năng của hàm.
 * Ghi chú kỹ thuật quan trọng (ví dụ: Row-Level Locking, Transaction scope).
 * 
 * @param {Type} paramName - Mô tả tham số
 * @returns {Promise<ReturnType>} Mô tả giá trị trả về
 * @throws {CustomError} Khi nào ném lỗi này
 */
```

### Enforcement Guidelines

**Tất cả AI Agents BẮT BUỘC:**
1. Đọc file `project-context.md` và phần Architecture Decisions TRƯỚC khi viết bất kỳ dòng code nào
2. Tuân thủ cấu trúc thư mục và naming conventions đã quy định — không tự ý tạo thư mục mới
3. Mỗi hàm trong Services/Repositories CHỈ thực hiện ĐÚNg MỘT nhiệm vụ (SRP)
4. Không bao giờ viết logic DB trong Controllers hoặc Routes
5. Sử dụng Custom Error classes thay vì trả response lỗi trực tiếp
6. Sử dụng ES Modules (`import/export`) — không dùng `require`
7. Import Prisma từ singleton `config/prisma.js` — không tạo `new PrismaClient()` mới
8. Viết JSDoc cho mọi hàm trong Services và Repositories

### Anti-Patterns (Tuyệt đối KHÔNG làm)

| ❌ Anti-Pattern | ✅ Correct Pattern |
|---|---|
| `res.status(400).json({error: "..."})` trong Controller | Ném `throw new BadRequestError("...")` để Global Middleware xử lý |
| `UPDATE "Wallet" SET "cachedBalance" = 100` (set giá trị tuyệt đối) | Luôn tính toán từ `currentBalance + delta` trong Transaction |
| `console.log("Error:", err)` | Sử dụng logger module hoặc ghi vào `FraudLog` |
| File `userService.js` chứa cả logic auth + wallet | Tách ra `auth.service.js` + `wallet.service.js` |
| Lưu JWT token trong `localStorage` | Sử dụng HTTP-Only Cookie |
| `const { PrismaClient } = require(...)` | `import prisma from '../config/prisma.js'` |
| Viết `try/catch` trong controller (Express 5) | Để async error tự bubble lên Global Error Middleware |
| `const prisma = new PrismaClient()` trong mỗi file | Import singleton từ `config/prisma.js` |

## Project Structure & Boundaries

### Complete Project Directory Structure

```
exe-prj/
├── README.md
├── docker-compose.yml                  # PostgreSQL database cho Development (local)
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                          # (Deferred - Post-MVP) GitHub Actions
│
├── backend/
│   ├── package.json                        # "type": "module", Express ^5.2.1, Prisma (chứa scripts db:up, db:down, db:reset)
│   ├── .env                                # DB_URL, JWT_SECRET, JWT_REFRESH_SECRET (gitignored)
│   ├── .env.example                        # Template cho developer mới
│   ├── nodemon.json                        # Cấu hình nodemon watch src/
│   ├── prisma/
│   │   ├── schema.prisma                   # Toàn bộ data models
│   │   ├── migrations/                     # Prisma Migrate history
│   │   └── seed.js                         # Seed data (starter points, demo surveys)
│   └── src/
│       ├── app.js                          # Express app setup, middleware registration
│       ├── server.js                       # HTTP server entry point (listen port)
│       ├── config/
│       │   ├── prisma.js                   # PrismaClient singleton
│       │   ├── jwt.js                      # JWT secret, expiry config
│       │   └── rate-limit.js               # Rate limiter config per endpoint group
│       ├── core/
│       │   ├── error-handler.js            # Global Error Middleware
│       │   ├── response-formatter.js       # { success, data } / { success, error } wrapper
│       │   ├── auth-middleware.js           # JWT cookie verification → req.userId
│       │   ├── admin-guard.js              # Kiểm tra req.user.role === 'ADMIN' (Party Mode #5)
│       │   ├── validate-request.js         # Generic Zod validate middleware wrapper (Party Mode #2)
│       │   └── custom-errors.js            # BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, TooManyRequestsError
│       ├── constants/
│       │   ├── ledger-types.js             # SUBMIT_SURVEY_REWARD, PUBLISH_SURVEY_ESCROW, DISPUTE_REFUND, STARTER_LOCKED_RELEASE
│       │   ├── ledger-status.js            # PENDING, COMPLETED, FAILED
│       │   ├── survey-status.js            # DRAFT, ACTIVE, PAUSED, COMPLETED, EXPIRED
│       │   ├── onboarding-steps.js         # REGISTER, DEMOGRAPHIC_SURVEY, FIRST_COMMUNITY_SURVEY, COMPLETED
│       │   └── fraud-types.js              # TIME_BARRIER_VIOLATION, WRONG_CODE, CONCURRENT_LIMIT_EXCEEDED
│       ├── validators/
│       │   ├── auth.validator.js           # Zod: registerSchema, loginSchema
│       │   ├── survey.validator.js         # Zod: createSurveySchema, submitCodeSchema
│       │   ├── wallet.validator.js         # Zod: withdrawRequestSchema
│       │   └── profile.validator.js        # Zod: updateProfileSchema (demographic fields)
│       ├── routes/
│       │   ├── index.js                    # Mount all route groups to /api/v1/ (Party Mode #1)
│       │   ├── auth.routes.js              # POST /register, POST /login, POST /refresh, POST /logout
│       │   ├── survey.routes.js            # GET /, POST /, GET /:id, POST /:id/start, POST /:id/submit-code
│       │   ├── wallet.routes.js            # GET /balance, GET /history, POST /withdraw-request
│       │   ├── profile.routes.js           # GET /me, PUT /me, POST /me/demographic
│       │   └── admin.routes.js             # GET /disputes, POST /disputes/:id/resolve, GET /audit-logs
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── survey.controller.js
│       │   ├── wallet.controller.js
│       │   ├── profile.controller.js
│       │   └── admin.controller.js
│       ├── services/
│       │   ├── auth.service.js             # registerUser, loginUser, refreshToken, logoutUser
│       │   ├── survey.service.js           # createSurvey, getAvailableSurveys, startSurvey
│       │   ├── survey-completion.service.js # processSubmission (Time Barrier + Code Match + Pending Reward)
│       │   ├── wallet.service.js           # deductPointsForSurveyPublish, creditPendingReward, settleDisputeRefund
│       │   ├── wallet-settlement.service.js # settlePendingBalances (Cron Job: 48h maturity)
│       │   ├── profile.service.js          # updateProfile, submitDemographicSurvey
│       │   ├── onboarding.service.js       # checkOnboardingStatus, unlockStarterPoints
│       │   ├── demographic-matching.service.js # matchSurveysToProfile (SQL-based filtering)
│       │   └── fraud-detection.service.js  # logTimeBarrierViolation, logWrongCode, checkConcurrentLimit
│       ├── repositories/
│       │   ├── user.repository.js
│       │   ├── survey.repository.js
│       │   ├── wallet.repository.js        # lockWalletByUserId, createLedgerEntry, updateWalletBalance
│       │   ├── fraud-log.repository.js
│       │   └── survey-response.repository.js
│       ├── utils/
│       │   ├── hash.js                     # bcrypt password hashing
│       │   ├── token.js                    # JWT sign/verify helpers
│       │   └── time-barrier-cache.js       # In-memory Map for start_time tracking
│       └── __tests__/                      # Shared test utilities (Party Mode #3)
│           └── helpers/
│               ├── test-prisma.js          # Mock PrismaClient cho unit tests
│               └── test-fixtures.js        # Factory functions tạo fake User, Survey, Wallet data
│
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── .env.local                          # NEXT_PUBLIC_API_URL (gitignored)
│   ├── .env.example
│   └── src/
│       ├── app/
│       │   ├── globals.css                 # Tailwind directives + custom design tokens
│       │   ├── layout.tsx                  # Root layout (metadata, fonts)
│       │   ├── page.tsx                    # Landing / Home page
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   ├── (main)/                     # Authenticated layout group
│       │   │   ├── layout.tsx              # Sidebar + TopNav wrapper
│       │   │   ├── dashboard/page.tsx      # User dashboard (stats, recent activity)
│       │   │   ├── surveys/
│       │   │   │   ├── page.tsx            # Survey Marketplace (browse + filter)
│       │   │   │   ├── my/page.tsx         # Khảo sát của tôi - Publisher view (Party Mode #6)
│       │   │   │   ├── history/page.tsx    # Lịch sử khảo sát đã tham gia - Respondent view (Party Mode #7)
│       │   │   │   ├── [id]/page.tsx       # Survey detail + Start button
│       │   │   │   ├── [id]/submit/page.tsx # Completion Code submission + Countdown Timer
│       │   │   │   └── create/page.tsx     # Create new survey form
│       │   │   ├── wallet/
│       │   │   │   └── page.tsx            # Wallet balance, pending, history
│       │   │   ├── profile/
│       │   │   │   └── page.tsx            # User profile + demographic editor
│       │   │   └── onboarding/
│       │   │       └── page.tsx            # Onboarding flow (demographic survey + first community survey)
│       │   └── admin/
│       │       ├── layout.tsx
│       │       ├── disputes/page.tsx       # Dispute management
│       │       └── audit-logs/page.tsx     # System audit logs
│       ├── components/
│       │   ├── atoms/
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Spinner.tsx
│       │   │   ├── Skeleton.tsx
│       │   │   └── PointsBadge.tsx         # Hiển thị số điểm có icon
│       │   ├── molecules/
│       │   │   ├── SearchBar.tsx
│       │   │   ├── PointDisplay.tsx        # Available + Pending balance
│       │   │   ├── CountdownTimer.tsx      # Time Barrier đếm ngược
│       │   │   ├── DemographicFilter.tsx   # Bộ lọc nhân khẩu học
│       │   │   └── TransactionItem.tsx     # Một dòng lịch sử giao dịch
│       │   ├── organisms/
│       │   │   ├── SurveyCard.tsx          # Card khảo sát trên marketplace
│       │   │   ├── SurveyList.tsx          # Danh sách + pagination
│       │   │   ├── MySurveyCard.tsx        # Card khảo sát của Publisher (escrow status, report fraud btn)
│       │   │   ├── SurveyHistoryCard.tsx   # Card lịch sử tham gia (pending/completed status)
│       │   │   ├── WalletPanel.tsx         # Panel ví điểm đầy đủ
│       │   │   ├── NavigationBar.tsx       # Thanh điều hướng chính
│       │   │   ├── CompletionCodeForm.tsx  # Form nhập mã + nút Submit (locked by timer)
│       │   │   └── OnboardingWizard.tsx    # Wizard onboarding nhiều bước
│       │   └── templates/
│       │       ├── PageLayout.tsx
│       │       └── DashboardLayout.tsx
│       ├── store/
│       │   ├── store.ts                    # configureStore
│       │   ├── provider.tsx                # 'use client'; StoreProvider wrapper
│       │   ├── slices/
│       │   │   ├── authSlice.ts
│       │   │   ├── walletSlice.ts
│       │   │   ├── surveySlice.ts
│       │   │   └── uiSlice.ts              # Modal state, sidebar toggle
│       │   └── api/
│       │       └── apiSlice.ts             # RTK Query: createApi + endpoints
│       ├── hooks/
│       │   ├── useAuth.ts                  # Login/logout/register hooks
│       │   ├── useCountdown.ts             # Hook cho đếm ngược Time Barrier
│       │   └── useOnboarding.ts            # Hook kiểm tra trạng thái onboarding
│       ├── utils/
│       │   ├── formatPoints.ts             # Format số điểm (1,000 → 1K)
│       │   ├── formatDate.ts               # Format ISO date sang locale
│       │   └── cn.ts                       # Tailwind class merge utility
│       ├── types/
│       │   ├── user.ts                     # User, Profile interfaces
│       │   ├── survey.ts                   # Survey, SurveyTarget interfaces
│       │   ├── wallet.ts                   # Wallet, LedgerEntry interfaces
│       │   └── enums.ts                    # Mirror backend constants
│       └── lib/
│           └── api.ts                      # Base API URL config, cookie handling
│
└── docs/
    ├── api-reference.md                    # API endpoint documentation
    └── database-schema.md                  # ERD & schema documentation
```

### Architectural Boundaries

**API Boundaries:**
- Frontend → Backend: Tất cả giao tiếp qua REST API `/api/v1/*` với JWT HTTP-Only Cookie
- Backend → Database: Chỉ thông qua Prisma Client singleton (`config/prisma.js`)
- Backend → External: Google Forms links (chỉ lưu URL, không gọi API)

**Component Boundaries (Frontend):**
- `app/` pages chỉ import từ `components/` và `store/`
- Components KHÔNG import trực tiếp từ `store/` — sử dụng hooks từ `hooks/`
- `store/api/apiSlice.ts` là điểm duy nhất giao tiếp với Backend API

**Service Boundaries (Backend):**
- Controllers chỉ gọi Services — KHÔNG gọi Repositories trực tiếp
- Services gọi Repositories cho DB operations — KHÔNG viết raw query trong Services (ngoại trừ `SELECT FOR UPDATE` trong wallet.repository.js)
- Repositories KHÔNG gọi lẫn nhau — nếu cần cross-domain, Service orchestrate

**Data Flow:**
```
Frontend (RTK Query) → HTTP Request → Express Routes → Controller → Service → Repository → Prisma → PostgreSQL
                    ← HTTP Response ←                ←            ←         ←            ←
```

### Database Infrastructure (Party Mode)
- **Development (Local):** Sử dụng Docker Compose với `postgres:16-alpine`. Developer quản lý DB bằng các script npm (`db:up`, `db:down`, `db:reset`).
- **Production (Deploy):** KHÔNG dùng Docker self-hosted. Thay vào đó, sử dụng Managed PostgreSQL (VD: Neon, Supabase, Railway) để tận dụng automated backups và connection pooling.

### Route Mount Pattern (Party Mode #1)

```javascript
// backend/src/routes/index.js
import authRoutes from './auth.routes.js';
import surveyRoutes from './survey.routes.js';
import walletRoutes from './wallet.routes.js';
import profileRoutes from './profile.routes.js';
import adminRoutes from './admin.routes.js';

export default (app) => {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/surveys', surveyRoutes);
  app.use('/api/v1/wallet', walletRoutes);
  app.use('/api/v1/profile', profileRoutes);
  app.use('/api/v1/admin', adminRoutes);
};
```

### Generic Validate Request Middleware (Party Mode #2)

```javascript
// backend/src/core/validate-request.js
import { BadRequestError } from './custom-errors.js';

const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new BadRequestError(result.error.issues[0].message);
  }
  req.validated = result.data;
  next();
};

export default validateRequest;
```

### Escrow Balance Tracking (Party Mode #4)

Trường `escrowBalance` được thêm trực tiếp vào model `Survey` trong Prisma Schema:
```prisma
model Survey {
  id                    String   @id @default(uuid())
  publisherId           String
  title                 String
  description           String
  externalFormUrl        String?  // Google/Microsoft Forms link
  completionCode        String   // Mã xác nhận tĩnh (V1)
  pointsPerResponse     Int      // Số điểm thưởng mỗi lượt làm
  maxResponses          Int      // Tổng số lượt tối đa
  escrowBalance         Int      // Tổng điểm còn lại trong quỹ tạm giữ
  estimatedTimeSeconds  Int      // Thời gian ước tính hoàn thành (cho Time Barrier)
  status                String   // DRAFT, ACTIVE, PAUSED, COMPLETED, EXPIRED
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```
Khi trả điểm cho respondent, `escrowBalance` bị trừ. Khi `escrowBalance` = 0, khảo sát tự chuyển `status = 'COMPLETED'`.

### Requirements to Structure Mapping

| Feature / Module | Backend Files | Frontend Files |
|---|---|---|
| **Auth & Onboarding** | `auth.*`, `onboarding.service.js` | `(auth)/*`, `onboarding/*`, `authSlice.ts` |
| **Survey Marketplace** | `survey.*`, `demographic-matching.service.js` | `surveys/page.tsx`, `SurveyCard.tsx`, `surveySlice.ts` |
| **My Surveys (Publisher)** | `survey.service.js` (getPublisherSurveys) | `surveys/my/page.tsx`, `MySurveyCard.tsx` |
| **Survey History (Respondent)** | `survey-response.repository.js` | `surveys/history/page.tsx`, `SurveyHistoryCard.tsx` |
| **Survey Completion** | `survey-completion.service.js`, `fraud-detection.service.js` | `[id]/submit/*`, `CountdownTimer.tsx`, `CompletionCodeForm.tsx` |
| **Wallet & Ledger** | `wallet.*`, `wallet-settlement.service.js` | `wallet/*`, `WalletPanel.tsx`, `walletSlice.ts` |
| **Dispute System** | `admin.controller.js`, `wallet.service.js` (settleDisputeRefund) | `admin/disputes/*`, `MySurveyCard.tsx` (Report Fraud btn) |
| **Fraud Detection** | `fraud-detection.service.js`, `fraud-log.repository.js` | `admin/audit-logs/*` |
| **User Profile** | `profile.*`, `user.repository.js` | `profile/*`, `DemographicFilter.tsx` |

### Cross-Cutting Concerns Mapping

| Concern | Location |
|---|---|
| Error Handling | `backend/src/core/error-handler.js` + `custom-errors.js` |
| Response Format | `backend/src/core/response-formatter.js` |
| Authentication | `backend/src/core/auth-middleware.js` + `frontend/src/hooks/useAuth.ts` |
| Admin Authorization | `backend/src/core/admin-guard.js` (Party Mode #5) |
| Data Validation | `backend/src/validators/*.validator.js` + `backend/src/core/validate-request.js` |
| State Management | `frontend/src/store/` (Redux Toolkit + RTK Query) |
| Time Barrier Cache | `backend/src/utils/time-barrier-cache.js` (In-Memory Map) |
| Shared Constants | `backend/src/constants/` ↔ `frontend/src/types/enums.ts` |
| Test Utilities | `backend/src/__tests__/helpers/` (Party Mode #3) |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- ✅ Next.js (TS) + Tailwind + Redux Toolkit ↔ Express (JS) + Prisma + PostgreSQL: Hoàn toàn tương thích. Hai tầng giao tiếp qua REST API.
- ✅ Zod `^4.4.3` hoạt động trên cả TS (Frontend) và JS (Backend).
- ✅ Express `^5.2.1` hỗ trợ async error forwarding tự động — loại bỏ nhu cầu `asyncHandler`.
- ✅ JWT `^9.0.3` + HTTP-Only Cookie tương thích với Next.js App Router.
- ✅ `express-rate-limit` `^8.5.2` tương thích với Express 5.

**Pattern Consistency:**
- ✅ Naming conventions nhất quán (Frontend vs Backend).
- ✅ SRP pattern xuyên suốt: Routes → Controllers → Services → Repositories.
- ✅ Centralized Error Handling + Custom Error classes + Global Middleware.

**Structure Alignment:**
- ✅ Cấu trúc thư mục phản ánh chính xác các quyết định kiến trúc (tách `core/`, `constants/`, `validators/`, `repositories/`).
- ✅ Ranh giới component rõ ràng (Controller ≠ Service ≠ Repository).

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
- FR1: Đăng khảo sát & Escrow (Đã hỗ trợ qua `survey.service.js` + `wallet.service.js`) ✅
- FR2: Trả điểm qua Completion Code (Đã hỗ trợ qua `survey-completion.service.js`) ✅
- FR3: Locked Starter Points (Đã hỗ trợ qua `onboarding.service.js`) ✅
- FR4: Time Barrier (Đã hỗ trợ qua `time-barrier-cache.js` + FraudService) ✅
- FR5: Demographic Targeting (Đã hỗ trợ qua `demographic-matching.service.js`) ✅
- FR6: Dispute System (Đã hỗ trợ qua `admin.controller.js` + pending balance) ✅
- FR7: Publisher Surveys View (Đã hỗ trợ qua trang `surveys/my` - Party Mode #6) ✅
- FR8: Respondent History (Đã hỗ trợ qua trang `surveys/history` - Party Mode #7) ✅

**Non-Functional Requirements Coverage:**
- Transaction Integrity (ACID): Bắt buộc Prisma `$transaction` + Row-Level Locking (`SELECT FOR UPDATE`). ✅
- Security & Anti-Fraud: JWT HTTP-Only Cookie + Rate Limiting + FraudLog table. ✅
- Maintainability & SRP: Strict layered architecture + JSDoc enforcement. ✅

### Implementation Readiness Validation ✅

**Decision Completeness:** Tất cả thư viện core đều có version được xác nhận.
**Structure Completeness:** Cấu trúc thư mục chi tiết đến từng file, requirement mapping rõ ràng.
**Pattern Completeness:** 13 conflict points đã giải quyết, 8 bổ sung từ Party Mode.

### Gap Analysis Results

**Critical Gaps:** Không có.
**Important Gaps (Cần làm trong Sprint đầu):**
- Prisma Schema đầy đủ (User, FraudLog, SurveyResponse, DemographicTarget) chưa được viết chi tiết trong tài liệu này (sẽ làm trong Story Prisma Init).
- Refresh Token rotation strategy (sẽ làm trong Story Auth).
**Nice-to-Have Gaps:**
- Redis thay thế In-Memory Cache khi scale multi-instance.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Mô hình Ví điểm (Double-Entry Ledger + Row-Level Locking) an toàn, chống Race Condition triệt để
- SRP + Clean Code enforcement cực kỳ chặt chẽ
- Party Mode phản biện bổ sung hàng loạt cải tiến thực chiến (Docker local, Middleware generic)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
Cài đặt Frontend (Next.js) và Backend (Express 5 + Prisma + PostgreSQL Docker dev) theo kiến trúc thư mục đã định.
