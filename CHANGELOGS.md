# Nhật ký thay đổi (Changelog)

Mọi thay đổi đáng chú ý của dự án "Gymbros" sẽ được lưu lại trong tệp này.

## [v0.4.0] - 2025-12-15

### Thêm mới

- **Giao diện Dark Premium**: Cập nhật toàn bộ giao diện ứng dụng sang tông màu Tối/Cam sang trọng.
- **Màn hình chính (Home)**:
  - Thẻ thành viên điện tử với Mã vạch động (Code128).
  - Banner quảng cáo ("Power Pump").
  - Menu lưới truy cập nhanh (Workout, Diet, Shop, Blog).
  - Mục Hoạt động gần đây.
- **Màn hình cá nhân (Profile)**:
  - Header mới với Avatar và Hạng thành viên.
  - Dashboard thống kê (Số buổi tập, Calo, Thời gian).
  - Menu Cài đặt.
- **Hỗ trợ Mã vạch**: Tích hợp thư viện `react-native-barcode-svg` để tạo mã vạch động.

### Thay đổi

- **Màu sắc**: Cập nhật cấu hình trong `tailwind.config.js` và `Colors.ts` sang `#121212` (Nền), `#1E1E1E` (Surface), `#FFA500` (Chủ đạo).
- **Điều hướng**: Thanh Tab Bar dưới cùng được cập nhật theo theme tối (Nền tối, Không viền, Active màu Cam).
- **Màn hình Xác thực**: Đăng nhập (SignIn) và Đăng ký (SignUp) chuyển sang giao diện tối.
- **Components**: `MembershipCard`, `ClassCard`, `Button`, `InputField`, `GoogleSignInButton` được refactor sang Dark Mode.

## [v0.3.0] - 2025-12-15

### Thêm mới

- **Tính năng Lớp học**:
  - Bảng `classes` trong Supabase.
  - Bảng `bookings` trong Supabase.
  - Giao diện Đặt lớp (`classes.tsx`, `ClassCard.tsx`).
  - Logic Đặt lịch (Kiểm tra Hội viên + Kiểm tra trùng lặp).

## [v0.2.0] - 2025-12-15

### Thêm mới

- **Tính năng Hội viên**:
  - Bảng `membership_plans` trong Supabase.
  - Bảng `user_memberships` trong Supabase.
  - Giao diện Mua gói tập (`membership.tsx`, `MembershipCard.tsx`).
