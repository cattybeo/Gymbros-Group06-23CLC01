# Feature: Membership Redesign (v0.7.0)

## Overview

Cải thiện module Gói hội viên (Membership) bằng cách tách biệt khái niệm **Hạng thành viên (Tiers)** và **Gói cước (Plans)**. Điều này giúp hệ thống linh hoạt hơn trong việc định giá (Tháng/Năm) và quản lý quyền lợi (Features).

## Technical Implementation

### Database

Chuyển đổi từ `membership_plans` (cũ) sang 2 bảng mới:

1.  **`membership_tiers`**: Định nghĩa cấp bậc (Standard, Silver, Gold, Platinum) và quyền lợi (Features - JSONB).
2.  **`membership_plans`**: Định nghĩa giá bán và thời hạn (1 tháng, 3 tháng, 12 tháng) cho từng Tier.
3.  **`user_memberships`**: Lưu thông tin đăng ký của user (FK tới `membership_plans`).

### Frontend

- **Toggles**: Thêm switch "Month / Year" để người dùng dễ dàng so sánh giá.
- **Dynamic Features**: Hiển thị danh sách quyền lợi (✅) trực tiếp từ database thay vì hardcode.
- **Visual Hierarchy**: Làm nổi bật các gói cao cấp.

### Components

- `MembershipCard`: Được cập nhật để nhận prop `tier` và render Features List.

## Cách sử dụng

1.  **Xem gói**: Truy cập tab Membership. Toggle giữa Month/Year để xem giá.
2.  **Đăng ký**: Chọn gói và thanh toán qua Stripe.
3.  **Profile**: Sau khi mua, Profile sẽ hiển thị Tier tương ứng (VD: GOLD MEMBER).

## API & Queries

- Fetch Tiers: `supabase.from('membership_tiers').select('*')`
- Fetch Plans: `supabase.from('membership_plans').select('*')`
- Fetch User Plan: `user_memberships` join `membership_plans` join `membership_tiers`.
