// get_coupons.js - Express endpoint lấy danh sách mã giảm giá từ PostgreSQL
const express = require('express');
const pool = require('../src/config/db');

const router = express.Router();

// GET /get_coupons - Lấy danh sách mã giảm giá với thông tin cơ bản
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        code as mamg,
        discount_amount as mucgiam,
        remaining_quantity as soluongcon,
        min_order_amount as donhangtoithieu,
        description as mota,
        created_at as ngaytao
      FROM coupons
      WHERE remaining_quantity > 0
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching coupons:', err.message);
    res.status(500).json({ error: 'Failed to fetch coupons', message: err.message });
  }
});

module.exports = router;
