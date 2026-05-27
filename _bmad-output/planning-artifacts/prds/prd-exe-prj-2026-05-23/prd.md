---
title: 'Rescom'
status: 'final'
created: '2026-05-23'
updated: '2026-05-23'
---

# PRD: Rescom
*Working title — confirm.*

## 0. Document Purpose
This PRD outlines the requirements for Rescom, a survey exchange ecosystem powered by a Point System, initially targeting FPT University Da Nang students. It builds upon the established Product Brief (`brief.md`) and Business Spec (`rescom-bmad-spec.md`). Downstream workflows (Architecture, UX, Development) must strictly adhere to the Glossary and Functional Requirements defined here.

## 1. Vision
To become the de facto verified data collection network for academic research in Vietnam. Rescom transitions survey data collection from a system of "charity and begging" to a legitimate, win-win micro-task economy where effort (Points) has real monetary value, guaranteeing fair exchange and high data integrity.

## 2. Target User

### 2.1 Primary Persona
- **The Stressed Researcher (Student):** Needs high-quality, targeted survey responses to complete their graduation thesis or scientific research assessment on a tight deadline.

### 2.2 Jobs To Be Done
- **Functional:** Collect verified data from a specific demographic (e.g., 3rd-year Marketing students) without spamming.
- **Functional:** Earn points by taking surveys, which can later be cashed out or used to fund their own surveys.
- **Emotional:** Reduce anxiety related to missing research deadlines or getting rejected for bad sample data.

### 2.3 Non-Users (v1)
- B2B commercial market researchers and university faculty (deferred to Phase 3).

### 2.4 Key User Journeys
- **UJ-1. Creating a Targeted Survey Bounty.** 
  - **Persona + context:** A student needs 50 responses from Marketing majors. 
  - **Entry state:** Authenticated, has enough unlocked points. 
  - **Path:** Clicks "Create Survey", pastes a Google Form link, sets target criteria (Major = Marketing), sets the point bounty per response, and deposits points into escrow. 
  - **Climax:** The survey goes live on the marketplace.
  - **Resolution:** Points are deducted from balance and locked in a transaction state.
- **UJ-2. Earning Points via Completion.** 
  - **Persona + context:** A student wants to earn points to withdraw later.
  - **Entry state:** Authenticated.
  - **Path:** Browses marketplace, selects a survey matching their profile. Clicks to start (starting the time barrier timer). Completes the external Google Form, gets the completion code, returns to Rescom, and submits the code.
  - **Climax:** System validates the code and the time elapsed. 
  - **Resolution:** Points are transferred from the survey's escrow to the user's balance.

## 3. Glossary
- **Point:** The internal currency of Rescom. Used to reward survey completion and pay for survey hosting. Can eventually be withdrawn for real money.
- **Escrow:** The state where Points are locked by the system when a survey is published, guaranteeing payout to respondents.
- **Completion Code:** A unique string provided at the end of an external survey (e.g., Google Forms) used to verify that a respondent actually finished the survey.
- **Time Barrier:** An anti-fraud mechanism that compares `timeTaken` against `estimatedTime` to reject rushed or bot submissions.
- **Locked Starter Points:** 50 points given to new users that cannot be spent until they complete an onboarding demographic survey and one community survey.

## 4. Features

### 4.1 Survey Marketplace & Point Escrow
**Description:** The core engine allowing users to publish surveys, lock points, and for respondents to claim them. Realizes UJ-1 and UJ-2.

**Functional Requirements:**
#### FR-1: Publish Survey with Escrow
System must allow user to publish a survey by defining a URL, target demographic, and point bounty. The total points (bounty * target response count) must be deducted from the user's balance and held in escrow.
#### FR-2: Claim Points via Completion Code
System must allow a user to submit a Completion Code for a survey. If the code matches and the Time Barrier check passes, the bounty is transferred from escrow to the user's balance.

### 4.2 Anti-Fraud Mechanics
**Description:** Essential guardrails to ensure data integrity.

**Functional Requirements:**
#### FR-3: Locked Starter Points Protocol
System must grant 50 Locked Starter Points to new accounts. These points remain locked (unspendable) until the user completes the system demographic survey and exactly one community survey.
#### FR-4: Real-time Time Barrier
System must calculate `timeTaken = endTime - startTime`. If `timeTaken < estimatedTime`, system must reject the Completion Code submission, deny point transfer, and log the event to `fraud_logs`.

### 4.3 User Profile & Targeting
**Description:** Users must maintain accurate demographic profiles so publishers can target surveys.

**Functional Requirements:**
#### FR-5: Enforce Demographic Targeting
System must only display a published survey to users whose profiles match the publisher's defined demographic criteria (e.g., Major, Year, Age).

## 5. Non-Goals (Explicit)
- **NO Internal Form Builder for V1:** Users will use Google/Microsoft Forms and paste the link.
- **NO B2B Dashboards:** V1 is purely student-to-student (C2C).
- **NO Fiat Wallet Integration (Phase 1):** [ASSUMPTION: Real-money withdrawal is handled manually by admins in Phase 1 before building automated payment gateways].

## 6. MVP Scope

### 6.1 In Scope
- User authentication and demographic profiling.
- Point ledger (transactions, escrow, balance).
- Survey publishing with Completion Code generation/validation.
- Marketplace feed filtered by targeting.
- Locked Starter Points and Time Barrier anti-fraud.

### 6.2 Out of Scope for MVP
- Internal Form Builder with forced-attention mechanics (Deferred to V2).
- Automated fiat withdrawals (Deferred to V2).

## 7. Success Metrics
**Primary**
- **SM-1**: Marketplace Liquidity — 80% of published surveys reach their target response quota within 72 hours.
- **SM-2**: Data Integrity — Less than 5% of responses trigger the Time Barrier fraud rejection.

## 8. Open Questions
1. **Completion Code Uniqueness:** Do we generate a unique code per respondent, or a single static code per survey? [ASSUMPTION: Static code for V1 due to Google Forms limitations, relying on Time Barrier for fraud prevention].
2. **Point Value:** What is the actual fiat exchange rate of 1 Point?

## 9. Assumptions Index
- Inline assumption from 5 — Real-money withdrawal is handled manually by admins in Phase 1 before building automated payment gateways.
- Inline assumption from 8.1 — Static completion code for V1 due to Google Forms limitations, relying on Time Barrier for fraud prevention.

## 10. Future Scope (Phase 2)

Trong giai đoạn 2, Rescom sẽ mở rộng từ một nền tảng trao đổi liên kết sang một nền tảng thu thập dữ liệu toàn diện thông qua tính năng Internal Form Builder.

### 10.1 Internal Form Builder
- Publisher có thể tạo các câu hỏi (Trắc nghiệm, Điền ngắn, Đánh giá) trực tiếp trên Rescom.
- Respondent làm khảo sát trực tiếp trên nền tảng (không cần chuyển sang tab Google Forms).
- Hệ thống tự ghi nhận hoàn thành mà không cần sử dụng Completion Code tĩnh.

### 10.2 Dual-Pricing Mechanism (Cơ chế giá kép)
- Rescom sẽ áp dụng mức phí (Point Bounty) khác biệt như một công cụ điều tiết hành vi:
  - Internal Forms: Hưởng mức giá cơ bản (ưu đãi hơn).
  - External Forms (Google/Microsoft Forms): Áp dụng hệ số phụ thu (Ví dụ: x1.5 hoặc x2 số điểm Escrow) do chất lượng dữ liệu không được Rescom kiểm chứng trực tiếp.
