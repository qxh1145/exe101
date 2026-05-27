# Sprint Change Proposal

**Date:** 2026-05-27
**Project:** Rescom
**Status:** Approved

## 1. Issue Summary
Product Owner đã đề xuất ý tưởng chiến lược: Bổ sung hệ thống Form Builder nội bộ nhằm thay thế dần Google Forms, kết hợp cơ chế giá kép (Dual-Pricing) để thu hút người dùng. Mục đích là giúp hệ thống quản lý dữ liệu tốt hơn và ngăn chặn các lỗ hổng gian lận khi dùng Completion Code tĩnh. Tuy nhiên, để không làm chậm tiến độ MVP hiện tại, tính năng này được quyết định sẽ chỉ định nghĩa về mặt nghiệp vụ và đẩy sang Giai đoạn 2 (V2).

## 2. Impact Analysis
- **Epic Impact:** Không ảnh hưởng. Các Epic hiện tại phục vụ MVP vẫn tập trung vào Google Forms.
- **Story Impact:** Không có story nào bị thay đổi.
- **Artifact Conflicts:** Cần cập nhật PRD để phản ánh chiến lược phát triển dài hạn (Future Scope), định hướng cho team.
- **Technical Impact:** Không tác động đến kiến trúc MVP.

## 3. Recommended Approach
**Direct Adjustment (Scope Deferral):** 
Chỉ cập nhật tài liệu PRD để thêm phần "Phase 2". Điều này đảm bảo:
- Tầm nhìn của dự án được ghi nhận rõ ràng.
- Đội ngũ dev không bị phân tâm khỏi mục tiêu MVP.
- Đảm bảo MVP được launch sớm nhất có thể.

## 4. Detailed Change Proposals
**Artifact cần sửa:** `prd.md`
**Hành động:** Thêm Section 5.

```markdown
## 5. Future Scope (Phase 2)
Trong giai đoạn 2, Rescom sẽ mở rộng từ một nền tảng trao đổi liên kết sang một nền tảng thu thập dữ liệu toàn diện thông qua tính năng Internal Form Builder.

### 5.1 Internal Form Builder
- Publisher có thể tạo các câu hỏi (Trắc nghiệm, Điền ngắn, Đánh giá) trực tiếp trên Rescom.
- Respondent làm khảo sát trực tiếp trên nền tảng (không cần chuyển sang tab Google Forms).
- Hệ thống tự ghi nhận hoàn thành mà không cần sử dụng Completion Code tĩnh.

### 5.2 Dual-Pricing Mechanism (Cơ chế giá kép)
- Rescom sẽ áp dụng mức phí (Point Bounty) khác biệt:
  - Internal Forms: Hưởng mức giá cơ bản.
  - External Forms (Google/Microsoft Forms): Áp dụng hệ số phụ thu (Ví dụ: x1.5 hoặc x2 điểm Escrow) do chất lượng dữ liệu không được Rescom kiểm chứng trực tiếp.
```

## 5. Implementation Handoff
- **Scope Classification:** Minor (Thay đổi rất nhỏ, chỉ thêm text vào PRD).
- **Handoff To:** Developer Agent (BMad Quick Dev).
- **Deliverables:** Cập nhật file PRD thành công.
