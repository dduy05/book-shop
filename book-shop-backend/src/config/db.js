const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Kết nối PostgreSQL thất bại:', err.message);
    return;
  }
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  client.query(createTableQuery, (queryErr) => {
    release();
    if (queryErr) {
      console.error('❌ Lỗi khi khởi tạo bảng contact_messages:', queryErr.message);
    } else {
      console.log('✅ Bảng contact_messages đã sẵn sàng');
    }
  });
  
  console.log('✅ Đã kết nối thành công với PostgreSQL');
});

module.exports = pool;
