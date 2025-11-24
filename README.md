# Gymbros - Fitness Management Platform

Dự án phát triển ứng dụng quản lý phòng Gym (Mobile App & Admin Web) cho môn học Nhập môn Kỹ thuật phần mềm (FITUS - HCMUS).

## Tech Stack

- **Framework:** React Native (Expo SDK 54)
- **Routing:** Expo Router (File-based routing)
- **Styling:** NativeWind v2 (Tailwind CSS)
- **Database & Auth:** Supabase
- **Language:** TypeScript

---

## Hướng dẫn Cài đặt 

### 1. Yêu cầu tiên quyết
- Node.js (Khuyên dùng bản LTS 18 hoặc 20).
- Git.
- Điện thoại cài sẵn app **Expo Go**.

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
2. Liên hệ Leader để lấy API Key của Supabase và điền vào file `.env`.

---

## Cách chạy dự án

### Quy tắc quan trọng 
1. **KHÔNG commit file `package-lock.json`**. Nếu thấy nó xuất hiện, hãy xóa ngay lập tức. Chỉ dùng `yarn.lock`.

### Lệnh khởi chạy

```bash
# 1. Xóa cache (Nên chạy mỗi khi pull code mới về hoặc cài thêm lib)
npx expo start --clear
# Hoặc yarn start --clear

# 2. Chạy bình thường
yarn start
```
* Sau khi QR Code hiện lên:
    * **Android:** Bấm `a` (nếu dùng máy ảo) hoặc quét QR bằng app Expo Go.
    * **iOS:** Bấm `i` (nếu dùng máy Mac + Simulator) hoặc quét QR.
    * **Web:** Bấm `w`.

---

## Cấu trúc dự án

- `app/`: Chứa các màn hình và điều hướng (Router).
  - `(auth)/`: Login, Register. (Dự kiến).
  - `(tabs)/`: Màn hình chính (Home, Schedule, Profile).
  - `(admin)/`: Giao diện Web Admin (Dự kiến).
- `components/`: Các UI Component tái sử dụng (Button, Input...).
- `lib/`: Cấu hình Supabase, Axios...
- `assets/`: Hình ảnh, font chữ, icon...