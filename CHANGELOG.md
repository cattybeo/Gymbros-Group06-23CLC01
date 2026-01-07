# Nhật ký thay đổi (Changelog)

Mọi thay đổi đáng chú ý của dự án "Gymbros" sẽ được lưu lại trong tệp này.

## [v1.8.0] - 2026-01-08

### Thêm mới (Added)

- **Trainer QR Check-out**: Triển khai tính năng quét mã QR để xác nhận hoàn thành buổi tập (Check-out). PT quét mã từ Dashboard của học viên để đánh dấu `completed`.
- **Custom Alert Integration**: Thay thế hoàn toàn `Alert.alert` của hệ thống bằng `CustomAlertModal` trên toàn bộ phân hệ Trainer và các thành phần chung như nút đăng nhập Google.

### Thay đổi (Changed)

- **Unified Profiles Data Flow**: Loại bỏ cơ chế tự động chèn thông tin vào `user_metadata` của Supabase Auth. Toàn bộ thông tin cá nhân hiện được quản lý tập trung và duy nhất tại bảng `public.profiles`.
- **Attendance Logic Correction**: Phân định rõ vai trò: Nhân viên (Staff) thực hiện Check-in (`arrived`), PT thực hiện Check-out (`completed`) và lưu dấu `checkout_at`.
- **i18n Standardization**: Cập nhật bộ thuật ngữ "Hoàn thành" (Completed) thay cho "Hiện diện" (Attended) để phù hợp với quy trình chứng nhận buổi tập của PT.

### Sửa lỗi (Fixed)

- Khắc phục lỗi đồng bộ hóa dữ liệu Avatar khi cập nhật hồ sơ, đảm bảo thay đổi phản chiếu ngay lập tức trên UI.

## [v1.7.0] - 2026-01-11

### Thêm mới (Added)

- **Trainer Profile Management**: Cho phép PT chỉnh sửa tiểu sử (Bio), chuyên môn (Specialties) và họ tên trong ứng dụng.
- **Class Lifecycle Management**: Thêm trạng thái `status` cho lớp học (`scheduled`, `finished`). PT có thể nhấn "Hoàn thành buổi tập" để đóng lớp và kích hoạt AI phân tích.
- **Optimized Data Fetching**: Triển khai Supabase RPC `get_trainer_students` giúp tải danh sách học viên nhanh hơn và tiết kiệm băng thông.

### Thay đổi (Changed)

- **UX/UI Trainer Expansion**: Toàn bộ các màn hình Trainer (Lịch dạy, Học viên, Hồ sơ) đã được kết nối dữ liệu thật và bản địa hóa hoàn toàn.
- **Keyboard Handling**: Áp dụng `KeyboardAvoidingView` cho tất cả các form nhập liệu trong phân hệ Trainer để tránh bị che khuất bởi bàn phím.

### Sửa lỗi (Fixed)

- Khắc phục lỗi hiển thị dữ liệu mẫu (mock data) trên Dashboard khi đã có dữ liệu thật.

## [v1.6.0] - 2026-01-10

### Thêm mới (Added)

- **AI Coach Assistant (Trainer-specific)**:
  - Triển khai **Supabase Edge Function** mới `gymbros-coach-ai` dành riêng cho PT.
  - Tích hợp tính năng **Weekly Recap**: Tóm tắt hiệu suất lớp học và xu hướng tham gia của học viên.
  - Tính năng **Retention Alerts**: Tự động phát hiện học viên có nguy cơ nghỉ học dựa trên lịch sử điểm danh.
  - **Smart Broadcasts**: Dự thảo tin nhắn động lực hoặc thông báo gửi cho nhóm lớp.
- **Attendance Data Pipeline**:
  - Tự động ghi nhận `access_logs` khi Trainer điểm danh học viên trong lớp.
  - Cập nhật cơ sở dữ liệu hỗ trợ `class_id` trong nhật ký truy cập.

### Thay đổi (Changed)

- **Role-Based AI Architecture**:
  - Tách biệt hoàn toàn `gymbros-ai` (Gợi ý lớp học cho Member) và `gymbros-coach-ai` (Trợ lý hiệu suất cho PT).
  - Nâng cấp logic gợi ý Member sử dụng **Gemini 2.0 Flash Thinking** để cá nhân hóa sâu hơn theo Goals/Injuries.

## [v1.5.0] - 2026-01-08

### Thêm mới (Added)

- **Rich Trainer Profiles**:
  - Hỗ trợ hiển thị hồ sơ Trainer chi tiết: Số năm kinh nghiệm, Chứng chỉ, Kỹ năng chuyên môn.
  - Tích hợp **Social Deep Linking**: Liên kết trực tiếp đến Zalo (qua SĐT) và Facebook Messenger (qua Username) của PT.
  - Cập nhật Database Schema mới: `experience_years`, `social_links` (JSONB), `certificates`.

### Thay đổi (Changed)

- **Safe Default UX (Cancellation Logic)**:
  - Áp dụng nguyên tắc **"Safe Default"** cho toàn bộ các thao tác hủy (Lớp học, Membership).
  - Nút **Primary** (Nổi bật) luôn là hành động an toàn ("Giữ lại gói", "Không hủy").
  - Nút **Secondary** (Ghost/Red) mới thực hiện hành động hủy ("Hủy gói", "Có").
  - Nâng cấp `CustomAlertModal` hỗ trợ sự kiện `onSecondaryPress` riêng biệt.
- **Class Detail Safety**:
  - Thêm hộp thoại xác nhận (Confirm Dialog) khi hủy lớp trong màn hình Chi tiết lớp học, ngăn chặn thao tác nhầm lẫn.

### Sửa lỗi (Fixed)

- **UI & Stability**:
  - Khắc phục lỗi `Invariant Violation: scrollToIndex` khi cuộn danh sách lớp học (Thêm cơ chế retry).
  - Sửa lỗi nút "Đặt chỗ ngay" bị cắt chữ (Text Truncation) trên màn hình nhỏ.
  - Bổ sung toàn bộ các keys i18n còn thiếu cho các hộp thoại chung (`common.yes`, `common.no`, `common.processing`).

## [v1.4.3] - 2026-01-08

### Thay đổi (Changed)

- **Real-time Crowd Meter**:
  - Chuyển đổi cơ chế cập nhật từ Polling (30s) sang **Supabase Realtime** (Instant).
  - Biểu đồ nhiệt và sĩ số lớp học (Example: 15/20) cập nhật ngay lập tức khi có người đặt chỗ.
  - Cập nhật thuật toán sinh dữ liệu giả lập (Mock Data) để biểu đồ nhiệt có màu sắc thực tế hơn (Xanh/Vàng/Đỏ).

### Sửa lỗi (Fixed)

- **Membership Logic Consistency**:
  - Sửa lỗi hiển thị trạng thái hội viên không đồng nhất giữa màn hình `Membership` và `Profile`.
  - Profile Screen giờ đây sẽ tự động hiển thị **Standard** nếu gói hội viên (Gold/Silver) bị hủy hoặc hết hạn (Trước đây vẫn hiện Gold).

## [v1.3.2] - 2026-01-07

### Thay đổi (Changed)

- **i18n & Localization Audit**:
  - Loại bỏ hoàn toàn các chuỗi văn bản hardcoded và `defaultValue` trong mã nguồn.
  - Đồng bộ hóa logic dịch thuật cho 100% các thành phần UI (Classes, Membership, Heatmap).
  - Cập nhật thuật ngữ chuyên ngành Gym cho tiếng Việt tự nhiên hơn.
- **Code Quality & Stability**:
  - Nâng cấp lên ESLint 9 (Flat Config) với các quy tắc nghiêm ngặt hơn.
  - Giải quyết triệt để các cảnh báo React Hook (dependency array) và biến không sử dụng.
  - Sửa lỗi TypeScript nghiêm trọng liên quan đến thứ tự khai báo biến (Block-scoped variable errors).
  - Sửa các lớp Tailwind CSS không hợp lệ (`text-text`, `text-text_secondary`) để đảm bảo hiển thị đúng trên mọi thiết bị.

## [v1.3.1] - 2026-01-07

### Sửa lỗi (Fixed)

- **Stripe Android Critical Fix**:
  - Triển khai xử lý deep-linking (`returnURL`) trong root layout để ổn định quá trình thanh toán trên thiết bị Android.
  - Sửa lỗi PaymentSheet không tự động đóng sau khi thanh toán thành công.

## [v1.2.0] - 2026-01-07

### Thêm mới (Added)

- **AI Caching & Consistency Engine**:
  - Triển khai hệ thống lưu trữ đệm (Caching) sử dụng `AsyncStorage` để giảm 90% số lần gọi AI không cần thiết.
  - Tích hợp cơ chế **Context Chaining**: Gửi lại gợi ý cũ vào Edge Function để AI duy trì tính nhất quán khi tư vấn (Coach stability).
  - Tự động phát hiện thay đổi (Hash detection): AI chỉ làm mới gợi ý khi người dùng thay đổi mục tiêu hoặc đặt thêm lớp mới.
- **Tối giản giao diện Lớp học**:
  - Loại bỏ danh mục "Explore Classes" dư thừa để tối ưu không gian hiển thị trên mobile.
  - Nâng cấp nút "All" thành nút Reset bộ lọc thông minh (Xóa cả từ khóa tìm kiếm).

### Thay đổi (Changed)

- **Giao diện & Animation**:
  - Chỉnh sửa viền Pulse của gợi ý AI để không bị che khuất khi ở mép màn hình.
  - Tối ưu hóa hiệu ứng Scale khi Card được AI đề xuất giúp nổi bật hơn.
- **AGENTs.md**: Bổ sung quy trình **Commit Workflow (2026 Standardization)** bắt buộc cho mọi Agent.

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
