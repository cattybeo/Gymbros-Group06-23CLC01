# PRD - Advanced Classes & Personal Schedule System

**Status**: Draft  
**Version**: 1.0.0  
**Target Version**: v1.3.0  
**Authors**: Gymbros AI Agent

---

## 1. Executive Summary

Mục tiêu của tài liệu này là định nghĩa các tính năng nâng cao cho màn hình Lớp học (Classes Screen), tập trung vào việc hoàn thiện vòng lặp trải nghiệm người dùng từ lúc tìm kiếm, nhận gợi ý AI, đặt lịch, cho đến quản lý lịch tập cá nhân.

## 2. Problem Statement

Hiện tại ứng dụng chỉ hỗ trợ đặt lịch một chiều. Người dùng gặp các khó khăn sau:

- Không xem được danh sách các lớp đã đăng ký một cách tập trung.
- Không thể hủy lịch tập nếu có việc bận đột xuất.
- Giao diện danh sách lớp dài gây khó khăn trong việc điều hướng quay lại đầu trang.
- Thiếu thông tin về người hướng dẫn (Trainer) dẫn đến thiếu tin cậy.

## 3. Product Features (v1.3.0)

### 3.1. Hệ thống Quản lý Lịch tập (My Schedule)

- **Danh sách tập trung**: Một màn hình/modal chuyên biệt hiển thị các lớp học người dùng đã đặt.
- **Phân tách trạng thái**: Hiển thị rõ ràng các lớp "Sắp tới" (Upcoming) và "Đã tham gia" (History).
- **Hủy lịch**: Cho phép người dùng hủy đặt chỗ (Cancel Booking) kèm theo điều kiện thời gian (ví dụ: trước 1 tiếng).

### 3.2. Cải tiến Trải nghiệm Người dùng (UX Enhancement)

- **Floating Scroll-to-Top**: Nút cuộn nhanh về đầu trang khi danh sách quá dài.
- **Real-time Availability**: Tự động vô hiệu hóa nút "Đặt ngay" đối với các lớp đã bắt đầu hoặc đã kết thúc dựa trên thời gian thực.
- **Trainer Branding**: Hiển thị tên và ảnh của Trainer trực tiếp trên Class Card.

### 3.3. AI Consistency (Giai đoạn 2)

- AI sẽ nhắc nhở các lớp học trong "My Schedule" sắp diễn ra thay vì chỉ gợi ý lớp mới.

## 4. User Stories

1. **As a Member**, I want to see a list of my booked classes so that I don't forget my training sessions.
2. **As a Member**, I want to cancel a booking if I'm busy so that someone else can take my slot.
3. **As a Frequent User**, I want to quickly scroll back to the search bar so I don't waste time swiping up.

## 5. Technical Requirements

- **Database**: Cập nhật query Join giữa bảng `bookings` và `classes` để lấy thông tin chi tiết.
- **State Management**: Cập nhật Context hoặc Local State để đồng bộ ngay khi người dùng nhấn "Hủy".
- **Real-time**: Sử dụng `setInterval` hoặc `useFocusEffect` để kiểm tra thời gian thực so với `start_time` của lớp học.

## 6. Success Metrics

- Tỷ lệ người dùng truy cập màn hình "My Schedule" > 50% sau khi đặt lớp.
- Giảm tỷ lệ "Ghosting" (đặt nhưng không đi) thông qua tính năng Hủy lịch.
