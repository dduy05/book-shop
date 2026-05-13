const { Router } = require('express');
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  updateBookQuantity,
  deleteBook,
} = require('../controllers/bookController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = Router();

router.get('/', getAllBooks);

router.get('/:id', getBookById);

router.post('/', verifyToken, isAdmin, createBook);

router.put('/:id', verifyToken, isAdmin, updateBook);

router.patch('/:id/quantity', verifyToken, updateBookQuantity);

router.delete('/:id', verifyToken, isAdmin, deleteBook);

module.exports = router;
