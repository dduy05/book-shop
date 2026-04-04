const { Router } = require('express');
const { register, login } = require('../controllers/authController');

const router = Router();

// POST /api/auth/register — Đăng ký tài khoản mới
router.post('/register', register);

// POST /api/auth/login    — Đăng nhập, nhận JWT token
router.post('/login', login);

module.exports = router;
