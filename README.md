# itss_mart
# Convenient Grocery Shopping System (ITSS Mart)

Hệ thống mua sắm tạp hóa tiện lợi - Đồ án môn học ITSS (Nhóm 22).

## 📖 Tổng quan dự án
Dự án **ITSS Mart** là một ứng dụng web mô phỏng hệ thống mua sắm tạp hóa trực tuyến, bao gồm phía client (giao diện người dùng) và server (RESTful API). Hệ thống được thiết kế để giúp người dùng dễ dàng quản lý danh sách mua sắm, công thức nấu ăn và các tính năng khác của một hệ thống siêu thị mini.

## 🚀 Công nghệ sử dụng

### Frontend (`/client`)
- **Framework/Thư viện:** React.js (v18)
- **Build tool:** Vite
- **Icons:** Lucide React
- **Linter:** ESLint

### Backend (`/server`)
- **Môi trường:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Bảo mật & Xác thực:** bcryptjs (mã hóa mật khẩu), jsonwebtoken (JWT)
- **Upload file:** multer
- **Công cụ hỗ trợ:** dotenv, cors, nodemon (dev)

## 📁 Cấu trúc thư mục chính
```text
/
├── client/         # Chứa mã nguồn Frontend (React + Vite)
├── server/         # Chứa mã nguồn Backend (Express + Sequelize)
├── package.json    # Chứa các script chạy song song cả client và server
└── README.md       # Tài liệu dự án
```

## ⚙️ Hướng dẫn cài đặt và chạy dự án

### 1. Yêu cầu hệ thống
- **Node.js** (Khuyến nghị phiên bản 16.x hoặc mới hơn)
- **PostgreSQL** (Đã cài đặt và đang chạy)

### 2. Cài đặt Cơ sở dữ liệu
1. Mở PostgreSQL (pgAdmin hoặc CLI).
2. Tạo một database mới, ví dụ: `itss_mart`.
   ```sql
   CREATE DATABASE itss_mart;
   ```

### 3. Cấu hình biến môi trường
1. Di chuyển vào thư mục `server/`.
2. Tạo một file `.env` (nếu chưa có) và cấu hình các thông số kết nối Database, tham khảo mẫu dưới đây:
   ```env
   # PostgreSQL connection
   DB_HOST=localhost
   DB_PORT=5432       # Thay đổi port nếu PostgreSQL của bạn dùng port khác (VD: 2603)
   DB_NAME=itss_mart
   DB_USER=postgres
   DB_PASS=your_password

   # Server
   PORT=5000

   # Auth
   JWT_SECRET=itss_mart_jwt_secret_key_2024_nhom22
   JWT_EXPIRES_IN=7d
   ```

### 4. Cài đặt thư viện (Dependencies)
Từ thư mục gốc (root directory) của dự án, mở Terminal và chạy lệnh sau để cài đặt `node_modules` cho cả `client` và `server`:
```bash
npm run install:all
```
*(Lệnh này sẽ tự động gọi `npm install` bên trong cả hai thư mục client và server).*

### 5. Khởi tạo Database (Migration & Seeding)
Từ thư mục gốc, di chuyển vào thư mục `server/` để chạy các file khởi tạo dữ liệu:
```bash
cd server

# Chạy migrate để tạo bảng
npm run migrate

# Chạy seed để chèn dữ liệu mẫu (nếu cần)
npm run seed

# Quay lại thư mục gốc
cd ..
```

### 6. Khởi chạy dự án
Tại thư mục gốc của dự án, chạy lệnh:
```bash
npm run dev
```
Lệnh này sử dụng `concurrently` để chạy song song:
- **Backend API:** Sẽ chạy tại `http://localhost:5000`
- **Frontend Client:** Sẽ khởi động qua Vite (thường ở `http://localhost:5173`)
