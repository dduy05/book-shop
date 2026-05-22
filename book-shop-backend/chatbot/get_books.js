// get_books.js - Express endpoint lấy danh sách sách từ PostgreSQL
const express = require('express');
const pool = require('../src/config/db');

const router = express.Router();

// GET /get_books - Lấy danh sách sách với thông tin cơ bản
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.title as tensach, 
        b.author as tacgia, 
        b.price as gia, 
        b.quantity as soluong,
        b.description as mota,
        c.name as theloai
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.id DESC
      LIMIT 50
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err.message);
    res.status(500).json({ error: 'Failed to fetch books', message: err.message });
  }
});

module.exports = router;
