const pool    = require('../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

// ─── POST /api/auth/register ─────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate đầu vào
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng điền đầy đủ name, email, password' });
    }

    // Kiểm tra email đã tồn tại chưa
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ status: 'error', message: 'Email này đã được đăng ký' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm user mới (mặc định role = 'USER')
    const sql = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, 'USER')
      RETURNING id, name, email, role, created_at
    `;
    const result = await pool.query(sql, [name, email, hashedPassword]);
    const newUser = result.rows[0];

    res.status(201).json({
      status: 'success',
      message: 'Đăng ký tài khoản thành công',
      user: newUser
    });
  } catch (err) {
    console.error('register error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi đăng ký' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate đầu vào
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập email và password' });
    }

    // Tìm user theo email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      return res.status(400).json({ status: 'error', message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = result.rows[0];

    // So sánh password với hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Email hoặc mật khẩu không đúng' });
    }

    // Tạo JWT token (thời hạn 1 ngày)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      status: 'success',
      message: 'Đăng nhập thành công',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role
      }
    });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi đăng nhập' });
  }
};

module.exports = { register, login };
