# Nhật ký thay đổi (Changelog)

Mọi thay đổi đáng chú ý của dự án "Gymbros" sẽ được lưu lại trong tệp này.

## [v0.6.2] - 2025-12-17

### Thay ổi (Changes)

- **Lịch tập (Classes)**:
  - Hoàn thiện i18n cho màn hình `ClassesScreen` và `ClassCard`.
  - Hiển thị thông báo (Alert) bằng ngôn ngữ đã chọn.
- **Trang chủ (Home)**:
  - "Hoạt động gần đây" (Recent Activity) giờ hiển thị dữ liệu thật từ booking mới nhất.
- **Hồ sơ (Profile)**:
  - Thống kê (Workouts, Minutes) được tính toán từ lịch sử booking thực tế.
  - Thêm tính năng "Chỉnh sửa hồ sơ" (`Edit Profile`) để cập nhật Họ tên.
  - Refactor cấu trúc thư mục: `app/profile/edit.tsx`.

## [v0.6.1] - 2025-12-16

### Cải thiện (Improvements)

- **Trải nghiệm người dùng (UX)**:
  - Tối ưu cuộn danh sách (`ScrollView`, `FlatList`) với `decelerationRate="fast"` giúp cảm giác lướt "đầm" và mượt hơn.
  - Sửa lỗi hiển thị nút "Đăng Ký" bị xuống dòng trên thẻ thành viên.
- **Đa ngôn ngữ (i18n)**:
  - Hoàn tất dịch thuật cho thanh Tab Bar (Trang chủ, Hồ sơ, Gói tập, Lịch tập).
  - Áp dụng đa ngôn ngữ cho tên các Gói tập (Gói Bạc, Gói Vàng...) dựa trên `image_slug`.
  - Dịch đơn vị đo lường trong Profile (Buổi, Kcal/Ngày, Phút).

### Sửa lỗi (Bug Fixes)

- **Membership**: Khắc phục lỗi hiển thị trạng thái "Đăng ký ngay" thay vì "Nâng gói" đối với các hạng thẻ cao hơn.

## [0.6.0] - 2025-12-16

### Thêm mới

- **Thanh toán (Stripe Integration)**:
  - Tích hợp Stripe Payment Sheet cho luồng thanh toán Native.
  - Xây dựng Edge Function `payment-sheet` để xử lý bảo mật thanh toán.
  - Hỗ trợ thanh toán các gói Silver, Gold, Platinum.
- **Tối ưu hóa (Performance)**:
  - Áp dụng `Promise.all` tại màn hình Profile và Home để tải dữ liệu song song.
- **Tài liệu**:
  - Hướng dẫn cài đặt và deploy Stripe (`stripe_setup_guide.md`).

### Sửa lỗi

- **Database**: Đồng bộ code với Schema chuẩn (`Membership` -> `user_memberships`).
- **Logic**: Sửa lỗi insert cột `type` không tồn tại khi kích hoạt gói tập.

## [v0.5.1] - 2025-12-16

### Sửa lỗi

- Sửa lỗi hiển thị Barcode bằng cách cập nhật named exports cho thư viện `react-native-barcode-creator`.
- Khắc phục lỗi "Hình chữ nhật trắng" trên Barcode bằng cách chỉnh full-width và thiết lập màu nền/màu vạch cụ thể.
- Sửa lỗi System Navigator che khuất Tab Bar trên Android.

### Thêm mới

- Triển khai đa ngôn ngữ (i18n) hoàn chỉnh cho màn hình Đăng ký (`sign-up.tsx`).
- Kết nối màn hình Profile với dữ liệu thật (`body_indices` để tính BMR, `membership` để lấy hạng thành viên).

## [v0.5.0] - 2025-12-16

### Thêm mới

- **Đa ngôn ngữ (i18n)**: Tích hợp `i18next` và `expo-localization`. Hỗ trợ chuyển đổi Anh - Việt.
- **Giao diện**: Refactor các màn hình Welcome, SignIn, PersonalSpecs để hỗ trợ đa ngôn ngữ.

### Sửa lỗi

- **Build**: Khắc phục lỗi `native module 'ExpoLocalization' not found` bằng cách rebuild native app.

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
