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