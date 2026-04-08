const { Router } = require('express');
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = Router();

// GET    /api/books        — Lấy toàn bộ sách (public)
router.get('/', getAllBooks);

// GET    /api/books/:id    — Lấy một sách theo ID (public)
router.get('/:id', getBookById);

// POST   /api/books        — Thêm sách mới (chỉ admin)
router.post('/', verifyToken, isAdmin, createBook);

// PUT    /api/books/:id    — Cập nhật sách theo ID (chỉ admin)
router.put('/:id', verifyToken, isAdmin, updateBook);

// DELETE /api/books/:id    — Xóa sách theo ID (chỉ admin)
router.delete('/:id', verifyToken, isAdmin, deleteBook);

module.exports = router;
