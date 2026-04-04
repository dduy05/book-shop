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
