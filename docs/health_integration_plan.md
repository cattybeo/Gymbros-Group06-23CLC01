# Báo cáo Tính khả thi & Kế hoạch Tích hợp Sức khỏe (Health Integration)

## Tổng quan

Tài liệu này phác thảo chiến lược tích hợp **Google Health Connect** (Android) và **Apple HealthKit** (iOS) vào ứng dụng Gymbros. Việc tích hợp này cho phép Gymbros đồng bộ hóa dữ liệu như Số bước chân, Lượng calo tiêu thụ, Nhịp tim và Các bài tập luyện từ thiết bị của người dùng.

## Thư viện Đề xuất

Chúng ta tránh được các hạn chế của "Expo Go" bằng cách sử dụng quy trình "Prebuild" (hiện tại dự án đang sử dụng).

| Nền tảng    | Thư viện                      | Mô tả                                                                                   |
| :---------- | :---------------------------- | :-------------------------------------------------------------------------------------- |
| **Android** | `react-native-health-connect` | Tiêu chuẩn hiện đại cho Android 14+ (và tương thích ngược). Thay thế Google Fit API cũ. |
| **iOS**     | `react-native-health`         | Thư viện tiêu chuẩn để tích hợp Apple HealthKit.                                        |

## Lộ trình Triển khai

### Giai đoạn 1: Chuẩn bị (Đã hoàn thành)

- [x] Nghiên cứu thư viện.
- [x] Tài liệu hóa các quyền truy cập cần thiết.

### Giai đoạn 2: Cấu hình (Sprint Tương lai)

> [!WARNING]
> Việc thêm các thư viện này yêu cầu sửa đổi `AndroidManifest.xml` và `Info.plist`, điều này bắt buộc phải **Build lại Native** (`npx expo run:android`). Thực hiện việc này giữa chừng trong sprint hiện tại có thể gây mất ổn định cho bản build nếu không được kiểm tra kỹ lưỡng.

#### Thiết lập Android (`app.json` + `AndroidManifest.xml`)

1.  **Cài đặt**: `yarn add react-native-health-connect`
2.  **Cấu hình**: Thêm `health-connect` config plugin vào `app.json`.
3.  **Quyền hạn**:
    ```xml
    <!-- AndroidManifest.xml -->
    <uses-permission android:name="android.permission.health.READ_STEPS"/>
    <uses-permission android:name="android.permission.health.READ_HEART_RATE"/>
    <!-- ... và các quyền khác -->
    ```

#### Thiết lập iOS (`Info.plist`)

1.  **Cài đặt**: `yarn add react-native-health`
2.  **Cấu hình**: Thêm `NSHealthShareUsageDescription` và `NSHealthUpdateUsageDescription` vào `Info.plist` (Mô tả lý do sử dụng dữ liệu sức khỏe).

### Giai đoạn 3: Lập trình (Logic)

#### 1. Yêu cầu Quyền truy cập

Tạo một hook `useHealthData.ts`:

```typescript
import {
  initialize,
  requestPermission,
  readRecords,
} from "react-native-health-connect";

const initHealth = async () => {
  const isInitialized = await initialize();
  if (!isInitialized) return;

  await requestPermission([
    { accessType: "read", recordType: "Steps" }, // Đọc số bước
    { accessType: "read", recordType: "Weight" }, // Đọc cân nặng
  ]);
};
```

#### 2. Đồng bộ Dữ liệu

Thay vì nhập thủ công (Màn hình Body Index), chúng ta có thể "Tự động điền" từ Health Connect:

```typescript
const fetchWeight = async () => {
    // Lấy dữ liệu cân nặng trong khoảng thời gian...
    const { records } = await readRecords('Weight', { timeRangeFilter: ... });
    // Cập nhật state cục bộ -> Lưu vào Supabase
}
```

## Khuyến nghị

Nên triển khai **Giai đoạn 2 và 3** trong một sprint chuyên biệt cho "Tính năng Sức khỏe" (ví dụ: v0.5.x hoặc v0.6.x+), vì nó liên quan đến việc kiểm thử rộng rãi trên thiết bị thật và xử lý các trường hợp từ chối quyền riêng tư khác nhau.
