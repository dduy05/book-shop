-- Database Schema for Book Shop

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create books table with foreign key to categories
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  price int NOT NULL,
  image TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE books ADD quantity INTEGER DEFAULT 0;

-- Create wishlist table for saved user favorites
CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, book_id)
);

-- Create carts table for user shopping carts
CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, book_id)
);

-- Create orders table for order management
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  original_amount INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  shipping_address TEXT,
  payment_method VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_details table for order items
CREATE TABLE IF NOT EXISTS order_details (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL, -- price at the time of order
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create coupons table for discount codes
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  discount_amount INTEGER NOT NULL CHECK (discount_amount >= 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  min_order_amount INTEGER NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_coupons table to track coupon use per order
CREATE TABLE IF NOT EXISTS order_coupons (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  discount_amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (order_id, coupon_id)
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Viễn tưởng', 'Sách viễn tưởng'),
('Kinh dị', 'Sách kinh dị'),
('Khoa học', 'Sách khoa học'),
('Lịch sử', 'Sách lịch sử'),
('Hành động', 'Sách hành động')
ON CONFLICT (name) DO NOTHING;

-- Insert sample users (passwords are hashed)
-- Note: Replace with actual hashed passwords
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@example.com', '$2a$10$IcjIc8CAylpoqsP86Q3sV.ZTkhNPhI26xQBh62KGApm5rOZ2s32g6', 'ADMIN'),  -- password: test123
('User', 'user@example.com', '$2a$10$IcjIc8CAylpoqsP86Q3sV.ZTkhNPhI26xQBh62KGApm5rOZ2s32g6', 'USER')      -- password: test123
ON CONFLICT (email) DO NOTHING;

-- Insert sample books
INSERT INTO books (title, author, category_id, price, quantity, description) VALUES
('Dune', 'Frank Herbert', 1, 150000, 10, 'Một cuốn sách viễn tưởng kinh điển'),
('The Shining', 'Stephen King', 2, 120000, 8, 'Một cuốn sách kinh dị về khách sạn ma ám'),
('Sapiens', 'Yuval Noah Harari', 3, 180000, 15, 'Lịch sử loài người từ thời tiền sử đến hiện đại'),
('The Guns of August', 'Barbara Tuchman', 4, 140000, 5, 'Mô tả về Thế chiến I'),
('The Bourne Identity', 'Robert Ludlum', 5, 130000, 12, 'Một cuốn sách hành động về điệp viên')
ON CONFLICT DO NOTHING;



-- Sample coupons
INSERT INTO coupons (code, discount_amount, remaining_quantity, min_order_amount, description) VALUES
('SUMMER10', 100000, 5, 200000, 'Giảm 100.000 VND cho đơn hàng từ 200k'),
('WELCOME50', 50000, 10, 100000, 'Giảm 50.000 VND cho đơn hàng đầu tiên'),
('FREESHIP', 30000, 20, 150000, 'Giảm giá đơn hàng 30.000 VND')
ON CONFLICT (code) DO NOTHING;

-- Create posts table for user blog-like posts
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  image VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mapping table: which books are attached to a post
CREATE TABLE IF NOT EXISTS post_books (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (post_id, book_id)
);