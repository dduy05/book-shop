const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'book_shop_db',
  password: '11227788',
  port: 5432
});

(async () => {
  try {
    console.log('=== TẠO BẢNG USERS ===');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Bảng users đã tạo');

    console.log('=== TẠO BẢNG CATEGORIES ===');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Bảng categories đã tạo');

    console.log('=== TẠO BẢNG BOOKS ===');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Bảng books đã tạo');

    console.log('=== THÊM DỮ LIỆU MẪU ===');
    await pool.query(`
      INSERT INTO categories (name, description) VALUES
      ('Fiction', 'Sách tiểu thuyết'),
      ('Non-Fiction', 'Sách phi tiểu thuyết'),
      ('Science', 'Sách khoa học'),
      ('History', 'Sách lịch sử'),
      ('Biography', 'Tiểu sử')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✓ Đã thêm categories mẫu');

    await pool.query(`
      INSERT INTO users (name, email, password, role) VALUES
      ('Admin', 'admin@example.com', '$2b$10$dummy.hash.for.demo', 'ADMIN'),
      ('User', 'user@example.com', '$2b$10$dummy.hash.for.demo', 'USER')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✓ Đã thêm users mẫu');

    console.log('=== HOÀN THÀNH ===');
    console.log('Database schema đã được tạo thành công!');

    pool.end();
  } catch (err) {
    console.error('✗ Lỗi:', err);
    pool.end();
  }
})();