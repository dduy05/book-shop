require('dotenv').config(); // Phải load đầu tiên, trước các require khác

const express = require('express');
const cors    = require('cors');
const db      = require('./src/config/db'); // Trigger kiểm tra kết nối DB khi khởi động
const bookRoutes = require('./src/routes/bookRoutes');
const authRoutes = require('./src/routes/authRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const wishlistRoutes = require('./src/routes/wishlistRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────
// Cho phép Angular (localhost:4200) gọi API không bị CORS block
app.use(cors());

// Đọc request body dạng JSON
app.use(express.json());

// Phục vụ file tĩnh (hình ảnh) từ thư mục public
app.use(express.static('public'));

// ── Routes ──────────────────────────────────────────────
// Route kiểm tra server đang chạy
app.get('/api/status', (req, res) => {
  res.json({ status: 'success', message: 'Backend is running' });
});

// Routes xác thực
app.use('/api/auth', authRoutes);

// Routes sách
app.use('/api/books', bookRoutes);

// Routes categories
app.use('/api/categories', categoryRoutes);

// Routes wishlist
app.use('/api/wishlist', wishlistRoutes);

// ── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.originalUrl} không tồn tại` });
});

// ── Global Error Handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ status: 'error', message: 'Lỗi server nội bộ' });
});

// ── Khởi động server ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📡 API Status: http://localhost:${PORT}/api/status`);
});
