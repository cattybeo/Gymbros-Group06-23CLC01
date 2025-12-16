# Gymbros - Fitness Management Platform

Dự án phát triển ứng dụng quản lý phòng Gym (Mobile App & Admin Web) cho môn học Nhập môn Kỹ thuật phần mềm (FITUS - HCMUS).

## Tech Stack

- **Framework:** React Native (Expo SDK 54)
- **Routing:** Expo Router (File-based routing)
- **Styling:** NativeWind v4 (Tailwind CSS)
- **Database & Auth:** Supabase
- **Language:** TypeScript
- **External OAuth:** Google Sign-In

---

## Hướng dẫn Cài đặt

### 1. Yêu cầu tiên quyết

- Node.js (Khuyên dùng bản LTS 18 hoặc 20).
- Git.
- Android Studio (để chạy Emulator) hoặc điện thoại Android thật.
- EAS CLI: `npm install -g eas-cli`

### 2. Clone dự án & Cài đặt thư viện

Mở terminal và chạy các lệnh sau:

```bash
# Clone code về máy
git clone https://github.com/duckmankie/Gymbros-Group06-23CLC01.git
cd gymbros

# Lưu ý: Nếu chưa có Yarn, cài đặt Yarn qua Corepack
# npm install -g corepack
# Hoặc npm install -g yarn

# Kích hoạt Corepack để dùng Yarn (Nếu chưa có)
corepack enable

# Cài đặt các thư viện (LƯU Ý: Tuyệt đối dùng Yarn, KHÔNG dùng npm install)
# Nếu có file package-lock.json, xóa nó đi trước khi chạy lệnh này
yarn install
```

### 3. Cấu hình biến môi trường

1. Copy file `.env.example` thành `.env`.
2. Liên hệ Leader để lấy các API Key và điền vào file `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_KEY`
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

---

## Cách chạy dự án

### Quy tắc quan trọng

1. **KHÔNG commit file `package-lock.json`**. Nếu thấy nó xuất hiện, hãy xóa ngay lập tức. Chỉ dùng `yarn.lock`.
2. **Dự án sử dụng Development Build**, không chạy được trên Expo Go.

### Lệnh khởi chạy

#### Cách 1: Dùng EAS Build (Khuyến nghị - Không cần cài Android Studio/Xcode)

**Yêu cầu:** Tài khoản Expo (miễn phí)

```bash
# Đăng nhập EAS (lần đầu)
eas login
```

**Android:**

```bash
# Build development cho Android
eas build --profile development --platform android

# Sau khi build xong (~10-15 phút), tải APK từ link và cài lên Emulator/Điện thoại
# Rồi chạy:
npx expo start --dev-client
```

**iOS:** (Cần tài khoản Apple Developer - $99/năm)

```bash
# Build development cho iOS
eas build --profile development --platform ios

# Sau khi build xong, cài file .ipa lên Simulator hoặc TestFlight
# Rồi chạy:
npx expo start --dev-client
```

---

#### Cách 2: Build Local (Không cần EAS)

**Android:** (Cần Android Studio)

```bash
# Build và cài app lên Emulator (lần đầu, mất 5-10 phút)
npx expo run:android

# Những lần sau chỉ cần chạy:
npx expo start --dev-client
```

**iOS:** (Cần macOS + Xcode)

```bash
# Build và cài app lên Simulator (lần đầu, mất 5-10 phút)
npx expo run:ios

# Những lần sau chỉ cần chạy:
npx expo start --dev-client
```

### Lưu ý quan trọng

- **Chỉ cần build lại** khi thêm/xóa native module (package có code Java/Swift).
- **Code TypeScript/JavaScript** thay đổi → Hot Reload tự động, không cần build lại.
- Mở app đã cài trên Emulator → Nó sẽ tự kết nối với Metro Bundler.
- **iOS trên Windows/Linux:** Chỉ có thể dùng EAS Build (build trên cloud của Expo).

---

## Cấu trúc dự án

- `app/`: Chứa các màn hình và điều hướng (Router).
  - `(auth)/`: Login, Register. (Dự kiến).
  - `(tabs)/`: Màn hình chính (Home, Schedule, Profile).
  - `(admin)/`: Giao diện Web Admin (Dự kiến).
- `components/`: Các UI Component tái sử dụng (Button, Input...).
- `lib/`: Cấu hình Supabase, Axios...
- `assets/`: Hình ảnh, font chữ, icon...

---

## Tối ưu hóa Build (Windows)

Nếu bạn code trên Windows, việc build Android có thể rất chậm do cơ chế file system của NTFS và Windows Defender. Dưới đây là các cấu hình để tăng tốc:

### 1. Cấu hình Gradle (Đã áp dụng)

File `android/gradle.properties` đã được cấu hình sẵn:

- **Tăng RAM**: `org.gradle.jvmargs=-Xmx4096m` (Cấp 4GB RAM cho tiến trình build).
- **Caching**: `org.gradle.caching=true` (Tái sử dụng kết quả build cũ).
- **Config Cache**: `org.gradle.configuration-cache=true` (Bỏ qua bước cấu hình nếu không có gì thay đổi).

### 2. Sử dụng Dev Drive (Khuyến nghị nâng cao)

Nếu máy bạn chạy Windows 11 và có nhiều RAM (>16GB), hãy tạo ổ **Dev Drive**:

1. Vào **Settings** > **System** > **Storage** > **Disks & Volumes** > **Create Dev Drive**.
2. Cấu hình chi tiết:
   - **Virtual hard disk size**: Tối thiểu **50GB** (Khuyên dùng 64GB-100GB để thoải mái không gian).
   - **Virtual hard disk format**: Chọn **VHDX** (Hiện đại, ổn định hơn).
   - **Virtual hard disk type**: Chọn **Dynamically expanding** (Tiết kiệm dung lượng ổ cứng thật, chỉ chiếm chỗ khi cần).
3. Di chuyển toàn bộ folder code `Gymbros` vào ổ này (Ví dụ ổ `D:\` hoặc `Z:\` mới tạo).
4. **Kết quả**: Tốc độ build sẽ tăng 30-40% nhờ File System ReFS và chế độ Performance của Defender.
