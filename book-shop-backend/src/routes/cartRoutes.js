const { Router } = require('express');
const { getCart, addToCart, removeFromCart, clearCart } = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.get('/', verifyToken, getCart);
router.post('/', verifyToken, addToCart);
router.delete('/:bookId', verifyToken, removeFromCart);
router.delete('/', verifyToken, clearCart);

module.exports = router;
