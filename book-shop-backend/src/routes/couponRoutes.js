const { Router } = require('express');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');

const router = Router();

router.get('/', verifyToken, isAdmin, getAllCoupons);
router.post('/', verifyToken, isAdmin, createCoupon);
router.put('/:id', verifyToken, isAdmin, updateCoupon);
router.delete('/:id', verifyToken, isAdmin, deleteCoupon);
router.post('/validate', verifyToken, validateCoupon);

module.exports = router;
