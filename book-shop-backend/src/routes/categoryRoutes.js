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

router.get('/', getAllCategories);

router.get('/:id', getCategoryById);

router.post('/', verifyToken, isAdmin, createCategory);

router.put('/:id', verifyToken, isAdmin, updateCategory);

router.delete('/:id', verifyToken, isAdmin, deleteCategory);

module.exports = router;