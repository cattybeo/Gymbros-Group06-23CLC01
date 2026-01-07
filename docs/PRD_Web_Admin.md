# Tài liệu Yêu cầu Sản phẩm (PRD): Gymbros Web Admin Console

## 1. Tổng quan

Gymbros Web Admin Console là nền tảng quản lý tập trung dành cho máy tính (desktop), được thiết kế để quản lý mọi hoạt động của phòng gym, dữ liệu người dùng và kiểm soát ra vào. Đây là "bộ não" điều hành dành cho Chủ phòng gym (Admin) và Nhân viên lễ tân (Staff).

## 2. Đối tượng sử dụng

| Vai trò   | Trách nhiệm                  | Nhu cầu chính                                                        |
| :-------- | :--------------------------- | :------------------------------------------------------------------- |
| **Admin** | Chủ sở hữu / Quản lý         | Báo cáo tài chính, kiểm soát người dùng mẫu, quản lý dữ liệu gốc.    |
| **Staff** | Lễ tân / Chăm sóc khách hàng | Check-in bằng mã vạch, giải quyết ticket khiếu nại, hỗ trợ hội viên. |

## 3. Yêu cầu chức năng

### 3.1. Nền tảng: Xác thực & Phân quyền (RBAC)

- **Xác thực đa vai trò**: Sử dụng Supabase Auth để đăng nhập.
- **Phân quyền dựa trên vai trò (RBAC)**: Menu và quyền truy cập API bị hạn chế dựa trên vai trò (`admin`, `staff`).
- **Đồng bộ hồ sơ**: Tự động tạo/cập nhật bảng `profiles` để lưu trữ dữ liệu vai trò.

### 3.2. Phân hệ Admin (Quản lý & Chiến lược)

- **Quản lý danh mục lớp học**:
  - Thêm, sửa, xóa (CRUD) cho 25+ lớp học (Tên, Mô tả, Sức chứa, Ảnh).
  - **Gán Huấn luyện viên (PT)**: Chỉ định PT phụ trách cho từng lớp học.
- **Quản lý gói hội viên**: Thiết lập và điều chỉnh các gói giá (Silver, Gold, Platinum).
- **Quản lý người dùng toàn diện**:
  - Lọc và quản lý Hội viên, PT và Nhân viên.
  - Khả năng khóa/tạm dừng tài khoản.
- **Quản trị cộng đồng**: Kiểm duyệt các bài đăng diễn đàn để đảm bảo môi trường tích cực.
- **Báo cáo & Phân tích**:
  - Dashboard tài chính (Xu hướng doanh thu).
  - Biểu đồ mật độ (Độ phổ biến của lớp học).
  - Xuất dữ liệu ra CSV/PDF để kiểm toán.

### 3.3. Phân hệ Nhân viên (Vận hành & Hỗ trợ)

- **Trung tâm Check-in**:
  - Sử dụng Webcam laptop để quét mã vạch Hội viên (mã UUID từ app mobile).
  - Thông báo thời gian thực về trạng thái hội viên (Còn hạn/Hết hạn).
- **Quản lý khiếu nại**:
  - Quản lý các "Ticket hỗ trợ" gửi từ Hội viên/PT.
  - Giao việc, cập nhật trạng thái (Chờ, Đã giải quyết) và phản hồi.

## 4. Ràng buộc kỹ thuật & Thiết kế

- **Kiến trúc**: React 19 + Vite (HMR nhanh) + TypeScript.
- **Giao diện**: Shadcn UI + Tailwind CSS. Hỗ trợ **Dark Mode** mặc định.
- **Quét mã**: Tích hợp `html5-qrcode` để giải mã mã vạch độ trễ thấp qua trình duyệt.
- **Cơ sở dữ liệu**: PostgreSQL với chính sách Row Level Security (RLS) qua Supabase.

## 5. Mô hình dữ liệu (Schema V2)

- `public.profiles`: `id (uuid)`, `full_name`, `avatar_url`, `role (text)`.
- `public.check_ins`: `id (uuid)`, `user_id`, `logged_at`, `staff_id`.
- `public.issue_tickets`: `id`, `reporter_id`, `subject`, `description`, `status`.

## 6. Chỉ số thành công

- **Tốc độ quét**: Thời gian quét mã vạch < 500ms.
- **Đồng bộ dữ liệu**: Các thay đổi từ Admin phản ánh ngay lập tức lên app Mobile.
- **Thẩm mỹ**: Giao diện đồng nhất với app Mobile (Theme Dark Premium).
