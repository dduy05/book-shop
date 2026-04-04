# 📚 Dự án Website Bán Sách Cũ (Fullstack MERN/PERN)

Một hệ thống thương mại điện tử chuyên cung cấp và bán lẻ sách, được thiết kế với giao diện mộc mạc, hoài cổ và tối ưu hóa trải nghiệm người dùng (UX/UI). Dự án áp dụng kiến trúc Fullstack hiện đại với Frontend là Angular 17+ (Standalone Components & Signals) và Backend là Node.js/Express kết hợp Cơ sở dữ liệu PostgreSQL.

## ✨ Các tính năng nổi bật (Features)

### 🎨 Frontend (Giao diện người dùng)
* **Giao diện hiện đại & Responsive:** Sử dụng PrimeNG và PrimeFlex, hiển thị tốt trên cả PC và Mobile.
* **Quản lý trạng thái thông minh:** Ứng dụng `Signals` của Angular 17 để xử lý Giỏ hàng (Cart) và Trạng thái Đăng nhập mượt mà, không giật lag.
* **Hệ thống Routing linh hoạt:** Điều hướng trang chủ, chi tiết sách, giỏ hàng và trang cá nhân (Profile).
* **Bắt lỗi Form (Validation):** Xử lý kiểm tra dữ liệu đầu vào (Reactive Forms) ngay trên trình duyệt (ví dụ: xác nhận mật khẩu, định dạng email).
* **Hệ thống Thông báo (Toast):** Phản hồi trực quan các hành động đăng nhập, đăng xuất, thêm vào giỏ hàng.

### ⚙️ Backend (Hệ thống xử lý)
* **RESTful API:** Cung cấp các endpoint chuẩn mực cho CRUD (Tạo, Đọc, Cập nhật, Xóa) sách và người dùng.
* **Bảo mật Xác thực (Authentication):** * Mã hóa mật khẩu một chiều bằng `bcryptjs`.
  * Cấp phát và xác thực phiên đăng nhập bằng `JSON Web Token (JWT)`.
* **Bảo vệ Route (Middleware):** Phân quyền truy cập (Người dùng cơ bản / Quản trị viên).

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Frontend:** Angular 17+, TypeScript, SCSS, PrimeNG, PrimeFlex, RxJS.
* **Backend:** Node.js, Express.js.
* **Database:** PostgreSQL.
* **Bảo mật:** `bcryptjs`, `jsonwebtoken`, `cors`.

---

## 📂 Cấu trúc thư mục (Folder Structure)

Dự án được chia làm 2 thư mục chính hoạt động độc lập:

### 1. 🖥️ Frontend (`/book-shop-frontend`)
```text
src/
├── app/
│   ├── components/      # Các thành phần tái sử dụng (Header, Footer, Auth-Dialog...)
│   ├── models/          # Định nghĩa kiểu dữ liệu TypeScript (book.model.ts, user.model.ts...)
│   ├── pages/           # Các trang hiển thị chính
│   │   ├── home/        # Trang chủ (Danh sách sách, Banner)
│   │   ├── detail/      # Trang chi tiết một cuốn sách
│   │   ├── cart/        # Trang quản lý giỏ hàng
│   │   └── profile/     # Trang thông tin tài khoản & đổi mật khẩu
│   ├── services/        # Gọi API và quản lý State (auth.service.ts, book.service.ts, cart.service.ts)
│   ├── app.component.* # Component gốc của ứng dụng
│   ├── app.config.ts    # Cấu hình Provider (HttpClient, Toast, Router)
│   └── app.routes.ts    # Cấu hình đường dẫn (Routing)
├── assets/              # Chứa hình ảnh, icons, logo

2. 🗄️ Backend (/book-shop-backend)
src/
├── config/              # Khởi tạo và kết nối Cơ sở dữ liệu (db.js)
├── controllers/         # Logic xử lý chính của từng API
│   ├── authController.js# Xử lý Đăng nhập, Đăng ký
│   └── bookController.js# Xử lý lấy danh sách sách, thêm, sửa, xóa sách
├── middleware/          # Tầng trung gian kiểm tra request
│   └── authMiddleware.js# Xác thực token JWT & Phân quyền Admin
├── routes/              # Định nghĩa các endpoint API
│   ├── authRoutes.js    # Routes: /api/auth/login, /api/auth/register
│   └── bookRoutes.js    # Routes: /api/books/...
.env                     # Chứa các biến môi trường bảo mật (Database URL, JWT Secret)
index.js                 # Điểm khởi chạy Server Express
package.json             # Danh sách thư viện Node.js
├── index.html           # Khung HTML gốc
├── main.ts              # Điểm khởi chạy của Angular
└── styles.scss          # CSS toàn cục (Thiết lập biến màu, typography)
🚀 Hướng dẫn cài đặt và khởi chạy (Getting Started)
1. Yêu cầu hệ thống (Prerequisites)
Node.js (phiên bản 18.x trở lên).

PostgreSQL (phiên bản 14.x trở lên) & pgAdmin 4.

Angular CLI (npm install -g @angular/cli).

2. Cài đặt Cơ sở dữ liệu (Database Setup)
Mở pgAdmin 4, tạo một database mới tên là book_shop_db.

Chạy đoạn script SQL sau để khởi tạo các bảng:

SQL
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price INT NOT NULL,
    image TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
3. Cài đặt và khởi chạy Backend
Mở Terminal, đi tới thư mục book-shop-backend:

Bash
# 1. Cài đặt thư viện
npm install

# 2. Tạo file biến môi trường (.env) ở thư mục gốc backend với nội dung:
# DB_USER=postgres
# DB_HOST=localhost
# DB_DATABASE=book_shop_db
# DB_PASSWORD=[Mật khẩu pgAdmin của bạn]
# DB_PORT=5432
# PORT=3000
# JWT_SECRET=ChuoiBiMatCuaBan

# 3. Chạy server ở chế độ phát triển
npm run dev
Server Backend sẽ chạy tại: http://localhost:3000

4. Cài đặt và khởi chạy Frontend
Mở một Terminal khác, đi tới thư mục book-shop-frontend:

Bash
# 1. Cài đặt thư viện
npm install

# 2. Khởi chạy ứng dụng Angular
npm start
Ứng dụng Frontend sẽ chạy tại: http://localhost:4200 (hoặc cổng ngẫu nhiên nếu 4200 bị trùng).
