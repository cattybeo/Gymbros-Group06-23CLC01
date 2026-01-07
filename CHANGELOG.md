# Nhật ký thay đổi (Changelog)

Mọi thay đổi đáng chú ý của dự án "Gymbros" sẽ được lưu lại trong tệp này.

## [v1.1.0] - 2026-01-07

### Thêm mới (Added)

- **Hệ thống AI Personal Trainer (Edge Computing)**:
  - Triển khai **Supabase Edge Function** (`gymbros-ai`) sử dụng SDK `@google/genai` mới nhất (giai đoạn 2025-2026).
  - Tích hợp mô hình **Gemini 2.5-Flash** với cấu hình **Dynamic Thinking** để tư duy gợi ý lộ trình tập luyện cá nhân hóa.
  - **Bảo mật tối đa**: Chuyển toàn bộ logic AI và API Key từ Client sang Server side.
  - Hỗ trợ phản hồi đa ngôn ngữ (Tiếng Việt và Tiếng Anh) dựa trên cài đặt của người dùng.
- **Tính năng AI Interactive trên Lớp học**:
  - Tự động gợi ý chính xác 3 lớp học phù hợp với mục tiêu (Tăng cơ/Giảm mỡ) và lịch trình của người dùng.
  - Hiệu ứng **Pulse Border Animation** và Badge **AI Recommended** cho các lớp học được gợi ý.
  - Tính năng **Click-to-Scroll**: Tự động cuộn đến lớp học khi nhấn vào gợi ý của AI.
  - Trạng thái tải dữ liệu Shimmer (Skeleton) chuyên nghiệp cho AI Suggestion Card.

### Thay đổi (Changed)

- **Giao diện Lớp học (UX Refinement)**:
  - Cập nhật **Sticky Search Bar**: Thanh tìm kiếm luôn cố định ở đầu danh sách giúp thao tác lọc nhanh hơn.
  - Cải thiện **Empty State**: Thêm hình ảnh minh họa và nút đặt lại bộ lọc khi không tìm thấy kết quả.
  - Tối ưu hóa hiệu năng danh sách khi cuộn và nhảy đến vị trí lớp học.
- **AGENTs.md**: Cập nhật tiêu chuẩn lập trình AI (Rule of Law 2026) cho toàn bộ đội ngũ agent.

## [v1.0.1] - 2026-01-07

### Thêm mới (Added)

- **Kiến trúc mã nguồn theo chuẩn 2026 Mobile**:
  - Tách màn hình `ClassesScreen` thành các component nhỏ hơn: `ClassCatalog`, `ClassesSkeleton`, `LiveClassList`.
  - Cải thiện trình bảo trì mã nguồn (Maintainability) và giảm quy mô file chính.

### Thay đổi (Changed)

- **Tối ưu hóa CrowdHeatmap (Premium & Live Status)**:
  - **Dữ liệu thực tế**: Nâng cấp lên 1500 bookings với thuật toán phân bổ theo giờ cao điểm (Peak Hours).
  - **Isolated Polling**: Di chuyển logic tự động làm mới (30s interval) vào trực tiếp component Heatmap.
  - **Pulse Animation**: Thêm hiệu ứng nhịp thở cho ô biểu đồ của giờ hiện tại.
  - **Granular Colors**: Cập nhật dải màu 6 mức độ chi tiết hơn cho biểu đồ đông đúc.
- **Khắc phục lỗi Re-rendering**: Loại bỏ hiện tượng toàn bộ màn hình Lớp học bị render lại khi dữ liệu Live cập nhật, chỉ cập nhật duy nhất những phần thay đổi dữ liệu.
- **Sửa lỗi Lint**: Khắc phục các lỗi về kiểu dữ liệu (JSX Namespace) và sắp xếp lại các import.

## [v1.0.0] - 2026-01-07

### Thêm mới

- **Thanh toán Hội viên (Membership Payments)**:
  - Tích hợp **Stripe SDK** cho thanh toán thực tế (VND).
  - Triển khai **Supabase Edge Functions** (Deno 2) để xử lý thanh toán và Webhook bảo mật.
  - Hỗ trợ chu kỳ thanh toán linh hoạt: 1 tháng, 3 tháng, 6 tháng và 12 tháng.
  - Tự động kích hoạt gói tập thông qua Stripe Webhook thành công.
- **Quản lý Hội viên**:
  - Tính năng hủy gói tập (`Cancel Membership`) ngay trong ứng dụng.
  - Phân cấp Hội viên mới: Standard (Free), Silver, Gold, Platinum.
  - Hệ thống dữ liệu Tiers và Plans đồng bộ hóa hoàn toàn với Database Redesign.

### Thay đổi

- **Kiến trúc ứng dụng**:
  - Cập nhật lên **New Architecture (Fabric)** cho Android để tăng hiệu năng.
  - Chuyển đổi toàn bộ logic Auth sang **Deno 2 Best Practices** trên Edge Functions.
  - Tối ưu hóa **AuthGuard** và cơ chế điều hướng mượt mà hơn.
- **Giao diện & Theme**:
  - Hệ thống **Dark/Light Mode Sync** hoàn thiện: Khắc phục lỗi lệch pha màu sắc giữa JS và CSS.
  - Cải tiến **CustomAlertModal**: Hỗ trợ bố cục nút thông minh hơn cho màn hình di động.
  - Giao diện Membership mượt mà hơn với các hiệu ứng chuyển cảnh và Skeleton loading.

### Sửa lỗi

- **Layout**: Khắc phục lỗi đệ quy CSS (Infinite Loop) trong NativeWind v4.
- **Android**: Gỡ bỏ cảnh báo `setLayoutAnimationEnabledExperimental` trên kiến trúc mới.
- **Database**: Sửa lỗi truy vấn cột không tồn tại sau khi thiết kế lại Schema.
- **Logic**: Sửa lỗi người dùng vẫn thấy gói tập đã hủy cho đến khi hết hạn.

## [v0.9.2] - 2026-01-07

### Thêm mới (Added)

- **Mở rộng danh mục Lớp học (25 môn)**:
  - Thêm 22 khoá học mới dựa trên xu hướng fitness 2026 (Pilates Máy, Đạp Xe VR, Trị Liệu Âm Thanh, Boxing Thể Hình...).
  - Tạo 21+ logo cao cấp được thiết kế bởi AI (DALL-E 3) cho tất cả các môn học.
- **Hệ thống Shimmer Skeleton Loading chuyên sâu**:
  - `ClassCardSkeleton`: Placeholder chính xác 1:1 cho thẻ lớp học.
  - `CatalogSkeleton`: Placeholder cho thanh lọc danh mục.
  - Tích hợp trạng thái loading cho `CrowdHeatmap` (Biểu đồ đông đúc).
  - Hiệu ứng Fade-in (500ms) mượt mà khi dữ liệu sẵn sàng trên cả màn hình Membership và Classes.

### Thay đổi (Changed)

- **Tối ưu hiệu năng danh sách (FlatList)**:
  - Memoization cho `ClassCard` để giảm re-render không cần thiết.
  - Tinh chỉnh `windowSize`, `initialNumToRender` và `removeClippedSubviews` cho 60fps scrolling với 25+ item.
- **Tái cấu trúc Assets**:
  - Thống nhất toàn bộ 25 ảnh lớp học vào thư mục `assets/images/classes/`.
  - Cập nhật mapping tập trung trong `constants/Images.ts`.
- **Nâng cấp Skeleton Component**: Hỗ trợ thuộc tính height dạng phần trăm (`100%`) và fix lỗi kiểu dữ liệu TypeScript.

### Sửa lỗi (Fixed)

- **Zero Layout Shift**: Đảm bảo kích thước Placeholder khớp hoàn toàn với nội dung thật, loại bỏ tình trạng UI bị "nhảy" khi tải xong.
- **Bản dịch Tiếng Việt**: Dịch thuật 100% tên và mô tả 25 khoá học sang Tiếng Việt chuyên nghiệp.

## [v0.9.1] - 2026-01-07
