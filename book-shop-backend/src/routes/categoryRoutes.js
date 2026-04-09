const { Router } = require('express');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = Router();

// GET    /api/categories        — Lấy toàn bộ categories (public)
router.get('/', getAllCategories);

// GET    /api/categories/:id    — Lấy một category theo ID (public)
router.get('/:id', getCategoryById);

// POST   /api/categories        — Thêm category mới (chỉ admin)
router.post('/', verifyToken, isAdmin, createCategory);

// PUT    /api/categories/:id    — Cập nhật category theo ID (chỉ admin)
router.put('/:id', verifyToken, isAdmin, updateCategory);

// DELETE /api/categories/:id    — Xóa category theo ID (chỉ admin)
router.delete('/:id', verifyToken, isAdmin, deleteCategory);

module.exports = router;