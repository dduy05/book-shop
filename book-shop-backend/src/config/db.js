const { Pool } = require('pg');
require('dotenv').config();

// Tạo Pool kết nối dựa vào biến môi trường
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Kiểm tra kết nối ngay khi khởi động
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Kết nối PostgreSQL thất bại:', err.message);
    return;
  }
  release(); // Trả lại connection về pool
  console.log('✅ Đã kết nối thành công với PostgreSQL');
});

module.exports = pool;
