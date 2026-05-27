# Rescom - Dự án Nền kinh tế điểm Khảo sát 🚀

Chào mừng bạn đến với dự án **Rescom**! Đây là tài liệu hướng dẫn thiết lập môi trường phát triển (Local Setup) ngắn gọn và rõ ràng dành cho cả **Windows** và **macOS**. Dự án được thiết kế theo kiến trúc Decoupled: Frontend (Next.js) và Backend (Node.js/Express + PostgreSQL).

---

## 🛠️ Yêu cầu môi trường (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
- **Node.js** (Khuyến nghị phiên bản v20 trở lên)
- **Git** (Để clone dự án)
- **Docker Desktop** (Dùng để chạy database PostgreSQL cục bộ mà không cần cài đặt rườm rà)

---

## ⚙️ 1. Cài đặt Backend

Backend sử dụng Node.js, Express 5, Prisma ORM và cơ sở dữ liệu PostgreSQL.

### Bước 1.1: Cài đặt thư viện
Mở Terminal / Command Prompt và chạy:
```bash
cd backend
npm install
```

### Bước 1.2: Khởi động Database với Docker
Đảm bảo **Docker Desktop** đang mở, sau đó chạy lệnh để khởi động PostgreSQL:
```bash
docker-compose up -d
```
*(Lệnh này sẽ tải image và chạy DB ở cổng `5433` ngầm dưới background)*

### Bước 1.3: Cấu hình biến môi trường
Tạo một file `.env` trong thư mục `backend/` và copy nội dung sau vào:
```env
PORT=5005
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/rescom?schema=public"
JWT_SECRET="dev_secret_key_1234567890"
JWT_REFRESH_SECRET="dev_refresh_secret_key_0987654321"
FRONTEND_URL="http://localhost:3000"
```

### Bước 1.4: Khởi tạo Database & Seed dữ liệu mồi
Chạy chuỗi lệnh sau để tạo các bảng trong DB và chèn dữ liệu mẫu (users, surveys):
```bash
npx prisma db push
npx prisma db seed
```

### Bước 1.5: Chạy Backend Server
```bash
npm run dev
```
🎉 Backend sẽ chạy tại `http://localhost:5005`

---

## 🎨 2. Cài đặt Frontend

Frontend sử dụng Next.js 14, React 18, TailwindCSS và Redux Toolkit.

### Bước 2.1: Cài đặt thư viện
Mở một Tab Terminal mới (giữ Backend vẫn đang chạy) và thực hiện:
```bash
cd frontend
npm install
```

### Bước 2.2: Cấu hình URL cho API (Tuỳ chọn)
Mặc định Frontend đã trỏ gọi tới `http://localhost:5005/api/v1`. Tuy nhiên, nếu cần cấu hình lại, bạn có thể tạo file `.env.local` trong thư mục `frontend/` và thêm:
```env
NEXT_PUBLIC_API_URL=http://localhost:5005/api/v1
```

### Bước 2.3: Chạy Frontend Server
```bash
npm run dev
```
🎉 Frontend sẽ chạy tại `http://localhost:3000`

---

## 💡 Các lệnh hữu ích (Cheatsheet)

- **Dừng database (Docker):** `cd backend && docker-compose down`
- **Mở Prisma Studio (Giao diện xem Database):** `cd backend && npx prisma studio`
- **Chạy API Tests:** `cd backend && npm run test`
- **Kiểm tra Frontend:** `cd frontend && npm run lint`

Chúc bạn code vui vẻ! Nếu gặp lỗi trong quá trình setup, hãy đảm bảo cổng `5433` (cho Postgres) và `5005` (cho Backend) không bị trùng với các ứng dụng khác trên máy.
