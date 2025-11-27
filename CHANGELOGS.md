# Changelog

Mọi sự thay đổi của dự án Gymbros sẽ được ghi lại tại đây.

## [0.2.1] - 2025-11-28

### Enhanced

- Cải thiện độ mượt mà khi chuyển màn hình giữa Sign-In và Sign-Up.
- Đồng bộ màu nền giữa app và hệ thống (light/dark mode).

## [0.2.0] - 2025-11-28

### Added

- Tích hợp Google Sign-In với `@react-native-google-signin/google-signin`.
- Thêm `AuthContext` để quản lý trạng thái đăng nhập toàn cục.
- Thêm Navigation Guard tự động điều hướng dựa trên trạng thái auth.
- Tạo các component: `GoogleSignInButton`, `GoogleSignOutButton`, `InputField`, `Button`.
- Tạo màn hình Sign-In và Sign-Up với form validation.

### Changed

- Chuyển từ Expo Go sang Development Build để hỗ trợ native modules.
- Cấu trúc lại thư mục `lib/` với `GoogleAuth.ts`, `AuthContext.tsx`, `supabase.ts`.

---

## [0.1.0] - 2025-11-25

### Added

- Khởi tạo dự án với Expo Router & NativeWind v2.
- Tích hợp Supabase Client.
- Thêm thanh điều hướng Bottom Tab Bar.

### Fixed

- Sửa lỗi xung đột cấu hình Babel giữa NativeWind v4 và v2.
- Fix lỗi crash app do lệch version Reanimated.
