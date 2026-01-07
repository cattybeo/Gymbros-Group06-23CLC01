# EPIC - My Training Journey (v1.3.0)

**Description**: Hoàn thiện hệ thống quản lý lịch tập cá nhân và tối ưu hóa trải nghiệm người dùng trên màn hình Classes.

---

## Tasks & Workflow

### Phase 1: UX Polish & Scroll Management

- [ ] **Task 1.1**: Implement `ScrollToTop` Floating Action Button (FAB).
  - _Details_: Xuất hiện khi `scrollY > 500`. Hiệu ứng mờ dần (Fade) khi không sử dụng.
- [ ] **Task 1.2**: Real-time Class Guarding.
  - _Details_: Thêm logic so sánh `new Date()` với `class.start_time`. Disable button nếu lớp đã bắt đầu.

### Phase 2: Data Enrichment (Trainer & Detail)

- [ ] **Task 2.1**: Update Supabase queries to include Trainer Profile.
  - _Details_: Join bảng `classes` với `profiles` để lấy `trainer_name` và `avatar_url`.
- [ ] **Task 2.2**: UI Update for ClassCard.
  - _Details_: Thêm dòng "Trainer: [Name]" và Badge trạng thái (Sắp diễn ra/Đang diễn ra).

### Phase 3: My Schedule System

- [ ] **Task 3.1**: Create `MyScheduleScreen` (or Modal).
  - _Details_: Hiển thị danh sách từ bảng `bookings`. Phân nhóm theo ngày.
- [ ] **Task 3.2**: Cancel Booking Logic.
  - _Details_: Thêm nút "Cancel" với Confirm Alert. Gọi RPC hoặc Update status trong Supabase.
- [ ] **Task 3.3**: Entry Point Integration.
  - _Details_: Thêm nút icon lịch ở Header màn hình Classes để dẫn vào My Schedule.

### Phase 4: Final Integrity & Documentation

- [ ] **Task 4.1**: Update AGENTs.md with new patterns (nếu có).
- [ ] **Task 4.2**: Bump version to v1.3.0 and update CHANGELOG.md.

---

## Technical Notes

- Sử dụng `LayoutAnimation` hoặc `Reanimated` cho nút ScrollToTop.
- Cần kiểm tra kỹ RLS chính sách của Supabase cho việc cập nhật (Update) status trong bảng `bookings`.
