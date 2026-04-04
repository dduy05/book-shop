const { Router } = require('express');
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

const router = Router();

// GET    /api/books        — Lấy toàn bộ sách
router.get('/', getAllBooks);

// GET    /api/books/:id    — Lấy một sách theo ID
router.get('/:id', getBookById);

// POST   /api/books        — Thêm sách mới
router.post('/', createBook);

// PUT    /api/books/:id    — Cập nhật sách theo ID
router.put('/:id', updateBook);

// DELETE /api/books/:id    — Xóa sách theo ID
router.delete('/:id', deleteBook);

module.exports = router;
