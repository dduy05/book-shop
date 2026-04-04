const jwt = require('jsonwebtoken');

// ─── Middleware: Xác thực JWT token ──────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Không tìm thấy token xác thực' });
  }

  const token = authHeader.split(' ')[1]; // Lấy phần sau "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gắn thông tin user { id, role } vào request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'error', message: 'Token đã hết hạn, vui lòng đăng nhập lại' });
    }
    return res.status(401).json({ status: 'error', message: 'Token không hợp lệ' });
  }
};

// ─── Middleware: Kiểm tra quyền Admin ────────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Bạn không có quyền thực hiện hành động này' });
  }
  next();
};

module.exports = { verifyToken, isAdmin };
