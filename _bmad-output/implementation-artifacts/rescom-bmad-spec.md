# RESCOM - SYSTEM BUSINESS & TECHNICAL SPECIFICATION (BMAD)

## [B] BUSINESS CONTEXT & MARKET STRATEGY
* [cite_start]**Problem Statement:** Sinh viên thu thập dữ liệu sơ cấp thủ công gặp 5 vấn đề: Hiệu suất thấp (trôi link), Sai lệch mẫu (không lọc được đối tượng), Thiếu công bằng (xin xỏ chéo không ràng buộc), Dữ liệu rác (spam bừa), và Áp lực deadline[cite: 8, 20, 21].
* [cite_start]**Value Proposition:** Hệ sinh thái khảo sát tập trung, phân phối đúng tệp mẫu, ràng buộc bằng cơ chế Điểm thưởng (Point System) sòng phẳng dựa trên công nghệ[cite: 2, 3, 12, 13].
* [cite_start]**Target Segments:** - Niche: Sinh viên khối ngành Quản trị kinh doanh, Marketing, Truyền thông, Ngôn ngữ[cite: 28].
  - [cite_start]Beachhead Market: Tập trung xây dựng tệp người dùng tại ĐH FPT Đà Nẵng trước qua mạng lưới CLB nội bộ, sau đó scale liên trường[cite: 28].
* **Business Model (3 Stages):**
  - [cite_start]Giai đoạn 1: Free-to-use để kích hoạt vòng lặp hành vi người dùng (User đăng bài -> Kéo user khác làm -> Tích điểm -> Tiếp tục đăng bài)[cite: 63, 72].
  - [cite_start]Giai đoạn 2: Freemium (Boost hiển thị, xuất báo cáo nâng cao) + Ví ký quỹ tiền mặt đổi điểm (Hoàn tiền 100% nếu trả đủ điểm trong 14 ngày)[cite: 63].
  - [cite_start]Giai đoạn 3: B2B Hợp tác với các trường đại học, phòng quản lý khoa học[cite: 17, 63].

---

## [M] DOMAIN MODEL & CORE FEATURE LOGIC
* [cite_start]**The Survey Exchange Loop:** Vận hành như một sàn giao dịch điểm (Points) qua quy trình khép kín 5 bước: ĐĂNG BÀI -> CÀI ĐẶT TIÊU CHÍ MATCHING -> CỘNG ĐỒNG LÀM BÀI -> XÁC THỰC HỆ THỐNG -> CHUYỂN GIAO ĐIỂM[cite: 37, 38, 39, 40, 41, 42, 43].
* **Survey Types Verification:**
  - [cite_start]Form ngoài (Google/Microsoft Forms): Chủ form đặt mã hoàn thành cố định ở trang cảm ơn[cite: 5, 44]. [cite_start]Người làm khảo sát copy mã này nhập lại vào Rescom để đối chiếu nhận điểm[cite: 45].
  - [cite_start]Form nội bộ (Form Builder): Thiết kế trực tiếp trên Rescom, hệ thống tự động cộng điểm ngay khi submit hợp lệ[cite: 6, 46, 47].
* **Anti-Fraud Mechanics:**
  - [cite_start]Locked Starter Points: Tặng 50 điểm cho user mới nhưng ở trạng thái khóa. [cite_start]Buộc hoàn thành 1 khảo sát nhân khẩu học hệ thống + 1 khảo sát bất kỳ từ cộng đồng để mở khóa. [cite_start]Triệt tiêu clone tài khoản ảo[cite: 50].
  - [cite_start]Real-time Time Barrier: Thuật toán tính `timeTaken = endTime - startTime`. [cite_start]Nếu `timeTaken` < `estimatedTime` của khảo sát -> Từ chối cộng điểm (Chống click tặc/spam)[cite: 52].
  - [cite_start]Forced-Attention (Form Builder): Ép dừng 15-20s tại trang xem tài liệu/hình ảnh, cài câu hỏi bẫy (Attention-check questions)[cite: 53].

---

## [A] ARCHITECTURE & SYSTEM DATA FLOW
* **Tech Stack Reference:** Frontend (ReactJS, TypeScript, Tailwind CSS, Zustand) | Backend (Node.js Express, TypeScript) | Database (PostgreSQL).
* **Database Relations & Integrity:**
  - [cite_start]Bảng `users`: Lưu trữ profile nhân khẩu học chặt chẽ (Khoa, Ngành, Khóa học, Giới tính, Độ tuổi) để phục vụ Target Matching[cite: 11, 28].
  - [cite_start]Bảng `surveys`: Lưu cấu hình target, số điểm thưởng, mã hoàn thành chính xác (`correctCompletionCode`), và `estimatedTimeInSeconds`[cite: 44, 52].
  - Bảng `transactions`: Lưu nhật ký biến động điểm với cơ chế ACID Transaction nghiêm ngặt.
* **Directory Structure (Strict Kebab-Case):**
  - Backend: `/src/core/` (Xử lý tập trung), `/src/services/` (Logic nghiệp vụ), `/src/routes/` (Định tuyến).

---

## [D] DEVELOPMENT GUARDRAILS FOR AGENTS
* **Validation Rule:** Tất cả request body gửi lên liên quan đến kết quả khảo sát đều phải được validate chặt chẽ (Kiểm tra null, undefined, định dạng chuỗi mã hoàn thành).
* **Transaction Enforcement:** Tuyệt đối không viết lệnh cộng/trừ điểm riêng lẻ. Bắt buộc gom vào khối giao dịch (`db.transaction`) để nếu sập hệ thống giữa chừng, điểm số tự rollback về trạng thái cũ.
* **Logging Constraints:** Không lạm dụng `console.log`. [cite_start]Khi phát hiện hành vi gian lận thời gian làm bài, phải ghi nhận log vào bảng hệ thống `fraud_logs` kèm IP và UserID để phục vụ tính năng Report/Feedback ở Giai đoạn 2[cite: 67].