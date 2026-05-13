const { Router } = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} = require('../controllers/wishlistController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.get('/', verifyToken, getWishlist);
router.post('/', verifyToken, addToWishlist);
router.delete('/:bookId', verifyToken, removeFromWishlist);
router.delete('/', verifyToken, clearWishlist);

module.exports = router;