# Nhật ký thay đổi (Changelog)

Mọi thay đổi đáng chú ý của dự án "Gymbros" sẽ được lưu lại trong tệp này.

## [v0.9.1] - 2026-01-07

### Sửa lỗi (Fixed)

- **Lỗi Navigation Context**: Khắc phục triệt để lỗi "Couldn't find a navigation context" gây crash ứng dụng khi khởi động bằng cách sử dụng `useRootNavigationState` và đưa logic điều hướng vào `AuthGuard` component.
- **Khôi phục Dark Mode**: Sửa lỗi Dark Mode không hoạt động sau khi refactor root layout. Đã thêm lại container theme và tối ưu hóa màn hình loading.
- **Cập nhật SafeAreaView**: Thay thế toàn bộ các import `SafeAreaView` từ `react-native` sang `react-native-safe-area-context` để loại bỏ các cảnh báo (warnings) không còn được hỗ trợ.

### Cải thiện (Changed)

- **Đa ngôn ngữ Profile**: Hoàn tất việc quốc tế hóa (i18n) cho toàn bộ phần Profile, đảm bảo không còn văn bản tiếng Anh mã cứng trong UI Tiếng Việt.
- **Cấu trúc Root Layout**: Refactor lại `app/_layout.tsx` để tách biệt rõ ràng giữa logic giao diện (UI) và logic bảo mật/điều hướng (AuthGuard).

### Đã thêm (Added)

- **AuthGuard Component**: Thành phần mới giúp quản lý luồng điều hướng dựa trên trạng thái xác thực và onboarding của người dùng một cách ổn định hơn.

## [v0.9.0] - 2026-01-07

### Tính năng mới (Added)

- **Hỗ trợ Dark Mode**: Hoàn thiện chế độ tối với dual-mode control (System + Manual).
  - Phát hiện theme hệ thống (auto-follow device settings).
  - Toggle thủ công trong màn hình Settings (Light/Dark/System options).
  - Lưu trữ preference qua AsyncStorage (tồn tại qua app restarts).
  - Hệ thống semantic token cho consistent theming trên toàn bộ screens.
  - Hỗ trợ cả React Native's Appearance API và manual override.
- **Skeleton Loading System**: Shimmer effect loaders tái sử dụng cho UX tốt hơn.
  - Component Skeleton cho single elements.
  - Component SkeletonCard cho card-based layouts.
  - Mượt mà 60fps sử dụng react-native-reanimated.
  - Dark mode support với semantic tokens.
  - Optimized cleanup on unmount (Rule 15 compliance).
- **Cải thiện Profile Screen**:
  - Loading state với Skeleton UI.
  - Fade-in animation khi content load.
  - Đơn giản hóa dual loading state (loại bỏ ActivityIndicator confusion).

### Thay đổi (Changed)

- **Kiến trúc Theme System**:
  - Refactor từ system-only sang dual-mode control (system + manual).
  - Thêm ThemeContext với useThemeContext hook.
  - Tích hợp NativeWind v4's useColorScheme và setColorScheme.
  - Tất cả components giờ sử dụng theme context thay vì direct hooks.
- **Styling Consistency**:
  - Áp dụng semantic tokens throughout app.
  - Thay hardcoded colors bằng design system tokens.
  - Fix icon colors để sử dụng colors.foreground thay vì hardcoded values.

### Sửa lỗi (Fixed)

- **Hardcoded gender trong add-body-index.tsx**:
  - Fetch gender từ user metadata với fallback "male".
  - Fetch age từ birthday metadata nếu có.
- **Kích hoạt NativeWind dark: className variants** bằng cách gọi setColorScheme.
- **Khôi phục darkMode 'class' config** để enable manual theme toggle.
- **Update version number** sang 0.9.0 trong settings screen.

### Chi tiết kỹ thuật (Technical Details)

- **Files Modified**: 15+ files across app/, components/, lib/
- **Theme Tokens**: 50+ semantic color tokens defined trong global.css
- **Design System**: 7 border radius levels, 6 shadow levels, spacing tokens
- **Breaking Changes**: None - backward compatible

## [v0.8.0] - 2026-01-06

### Tính năng mới (Added)

- **Stripe React Native v0.57.2**: Tích hợp StripeProvider ở cấp độ root layout (app/\_layout.tsx) theo best practices.
  - Di chuyển StripeProvider từ tabs layout lên root layout để đảm bảo toàn bộ ứng dụng có thể truy cập Stripe SDK.
  - Stripe SDK v0.57.2 bao gồm các bản sửa lỗi cho Android PaymentSheet crashes có trong v0.50.x.
  - Cấu trúc Provider: RootLayout → StripeProvider → AuthProvider → RootLayoutNav → Stack.
  - StripeKeepJsAwakeTask registration vẫn được giữ lại như yêu cầu của Stripe SDK.

### Sửa lỗi (Fixed)

- **Stripe Plugin Config**: Khắc phục lỗi `TypeError: Cannot read properties of undefined (reading 'merchantIdentifier')`.
  - Plugin config thiếu object cấu hình, gây lỗi khi destructuring merchantIdentifier.
  - Cập nhật app.json để thêm options object với `enableGooglePay: false`.
  - Cho phép plugin chạy mà không cần merchantIdentifier (tính năng Apple Pay).
  - Chạy `npx expo prebuild --clean` để xác nhận fix.
- **UI Logic vs Config Logic**: Loại bỏ inline style với colors từ các Text component.
  - components/MembershipCard.tsx: Duration và Price text giờ sử dụng `className="text-primary"`.
  - app/(tabs)/index.tsx: JOIN NOW text giờ sử dụng `className="text-primary"`.
  - Text components nên sử dụng className với semantic tokens (UI Logic), không phải inline styles.

### Thay đổi (Changed)

- **Code Comments Cleanup**: Chuẩn hóa code comments trên toàn bộ codebase.
  - Áp dụng tags chuẩn: TODO (công việc tương lai), FIXME (lỗi đã biết), NOTE (ngữ cảnh quan trọng).
  - Dịch các bình luận tiếng Việt sang tiếng Anh.
  - Loại bỏ các bình luận dài dòng và giải thích hiển nhiên.
  - Loại bỏ TODO comment đã hoàn thành cho get_class_counts RPC (đã được implement).
  - Files ảnh hưởng: app/, components/, lib/ (14 files tổng cộng).

### Tài liệu (Documentation)

- **CLAUDE.md**: Làm rõ sự tách biệt giữa UI Logic và Config Logic cho NativeWind.
  - Thêm flowchart quyết định khi nào sử dụng className vs Colors.ts.
  - Tài liệu UI Logic: Sử dụng className cho View, Text, TouchableOpacity, etc.
  - Tài liệu Config Logic: Sử dụng Colors.ts cho màu icon, navigation themes, ActivityIndicator.
  - Bao gồm ví dụ component sử dụng kết hợp cả hai.
  - Giải thích tại sao sự tách biệt này cần thiết dựa trên giới hạn của NativeWind.

## [v0.7.3] - 2026-01-05

### Sửa lỗi (Fixed)

- **Avatar**: Khôi phục chức năng tải ảnh đại diện từ thư viện và cập nhật ngay lập tức.
- **Giao diện (UI)**: Sửa lỗi `SafeAreaView` tại màn hình Profile và Edit Profile, đảm bảo nội dung không bị che khuất bởi tai thỏ/notch.
- **Đa ngôn ngữ (i18n)**: Bổ sung các key bản dịch còn thiếu (`uploading`, `pick_image_error`, `email_label`) tại Edit Profile.

### Thêm mới (Added)

- **Cài đặt (Settings)**: Thêm màn hình Cài đặt riêng biệt, cho phép chuyển đổi ngôn ngữ Anh-Việt nhanh chóng.
- **Trải nghiệm**: Cải thiện khoảng cách (Spacing) và bố cục màn hình Chỉnh sửa hồ sơ.
- **Onboarding**: Cập nhật màn hình thu thập chỉ số cá nhân, đồng bộ với Profile 2.0 (Thêm Mục tiêu, Mức độ vận động, Kinh nghiệm).

## [v0.7.2] - 2026-01-05

### Sửa lỗi (Fixed)

- **Google Sign-In**: Khắc phục lỗi `DEVELOPER_ERROR` (Code 10) bằng cách cấu hình `google-services.json` trong `app.json` và xác định yêu cầu SHA-1.
- **Gym Classes**: Sửa lỗi tính toán "Số chỗ còn lại" (Spots Left) do RLS chặn. Đã triển khai RPC `get_class_counts` để đếm booking chính xác.
- **Dữ liệu mẫu (Mock Data)**: Sửa script `heatmap_migration.sql` để phân phối booking ngẫu nhiên thay vì dồn vào một lớp.
- **Giao diện (UI)**: Đổi tên "Lịch tập" thành "Lớp học" trong bản dịch tiếng Việt (`vi.json`) để rõ nghĩa hơn.

### Thêm mới (Added)

- **Tài liệu**: Tạo `storage_migration_guide.md` hướng dẫn migrate hình ảnh sang Supabase Storage.
- **Chiến lược**: Chuyển hướng sang phát triển "Profile 2.0" để thu thập dữ liệu cá nhân hóa trước khi làm AI.

## [0.7.1] - 2026-01-03

### Cải thiện & Sửa lỗi (Improvements & Fixes)

- **Membership Module Stabilization**:
  - **Server-side Fulfillment**: Chuyển logic kích hoạt gói từ Client sang Stripe Webhook để đảm bảo an toàn giao dịch tuyệt đối.
  - **Date Drift Fix**: Sửa lỗi trôi ngày khi gia hạn. Gói mới sẽ tự động cộng nối tiếp thời hạn nếu gói cũ chưa hết hạn.
  - **Cancel Membership**: Thêm nút "Hủy Gói Tập" cho phép user tự hủy gói đang hợat động (chuyển trạng thái sang `cancelled`).
  - **UX**: Cải thiện Logic mua gói, cho phép user chuyển đổi linh hoạt giữa gói Tháng/Năm (cùng Tier) mà không bị chặn.

## [0.7.0] - 2025-12-17

### Tính năng mới (New Features)

- **Membership Redesign**: Tái cấu trúc hoàn toàn module Hội viên.
  - Chuyển đổi sang mô hình **Hạng (Tier)** và **Gói (Plan)**.
  - Thêm tính năng hiển thị quyền lợi (Features) động từ Database.
  - Thêm nút chuyển đổi xem giá theo **Tháng/Năm** (Tiết kiệm hơn khi mua năm).
  - Cập nhật giao diện thẻ Membership mới, hiển thị đúng ảnh cho từng hạng (Bạc, Vàng, Bạch Kim).
- **Profile**: Cập nhật logic hiển thị Hạng thành viên dựa trên cấu trúc dữ liệu mới.

### Sửa lỗi (Bug Fixes)

- **Stripe**: Sửa lỗi warning "No task registered for key StripeKeepJsAwakeTask" bằng cách đăng ký background task hợp lệ.
- **i18n**: Bổ sung đầy đủ dịch thuật cho danh sách quyền lợi (Features) và các gói tập.
- **Assets**: Fix lỗi hiển thị ảnh mặc định cho các gói tập mới.

### Tài liệu (Documentation)

- Thêm `docs/feature-membership-redesign.md` mô tả chi tiết kiến trúc Membership mới.

## [0.6.5] - 2025-12-17

### Đã thêm (Added)

- **Theo dõi Chỉ số Cơ thể**: Màn hình mới để xem lịch sử và thêm bản ghi cân nặng/chiều cao (`profile/body-index`, `profile/add-body-index`).
- **Đa ngôn ngữ**: Bổ sung dịch tiếng Việt cho Hạng Thành viên (Tiêu chuẩn/Bạc/Vàng/Bạch kim) và các tính năng chỉ số cơ thể.
- **Tài liệu**: Thêm `health_integration_plan.md` (Tiếng Việt) phác thảo lộ trình tích hợp Google Health/Apple Health.

### Đã sửa (Fixed)

- **Giao diện**: Sửa lỗi `SafeAreaView` khiến nút "Lưu" bị che khuất ở màn hình Chỉ số cơ thể.
- **Header**: Ẩn header mặc định bị trùng lặp.
- **Refactor**: Cập nhật `ImagePicker.MediaTypeOptions` (đã lỗi thời) sang `['images']`.
- **Lỗi**: Sửa lỗi hiển thị "STANDARD MEMBER" tiếng Anh bằng cách ánh xạ dữ liệu gói tập sang key ngôn ngữ tương ứng.

## [v0.6.4] - 2025-12-17

### Sửa lỗi (Bug Fixes)

- Ẩn header mặc định bị trùng lặp tại các màn hình con của Profile (`edit`, `change-password`).

### Thêm mới (New Features)

- **Ảnh đại diện (Avatar)**:
  - Cho phép người dùng tải ảnh lên từ thư viện (sử dụng Supabase Storage).
  - Hiển thị ảnh đại diện từ Google nếu có (fallback).
  - Tự động hiển thị chữ cái đầu tên nếu chưa có ảnh.

## [v0.6.3] - 2025-12-17

### Sửa lỗi (Bug Fixes)

- Khắc phục lỗi thiếu key dịch thuật (`auth.name_label`, `common.save`) tại màn hình Chỉnh sửa hồ sơ.
- Thêm thông báo "Không hỗ trợ đổi Email" vào file ngôn ngữ.

### Thêm mới (New Features)

- **Đổi Mật Khẩu**: Thêm màn hình `ChangePasswordScreen` với tính năng xác thực mật khẩu cũ.

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
