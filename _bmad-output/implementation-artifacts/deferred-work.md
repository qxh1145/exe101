## Deferred from: code review of 1-1-setup-database-seeding.md (2026-05-24)
- Hardcoded `hashed_password_placeholder` in seed script [backend/prisma/seed.js]

## Deferred from: code review of 1-2-user-authentication-wallet-initialization.md (2026-05-24)
- Missing Rate Limiting on Auth endpoints (`/register` and `/login`). Deferred because this is an MVP phase and rate limiting will be handled later.

## Deferred from: code review of 1-3-demographic-profile-update.md (2026-05-24)
- `updateProfile` trong service vẫn cho phép cập nhật dữ liệu khi trạng thái đã là `COMPLETED`. (Chưa chặn người dùng cũ).
