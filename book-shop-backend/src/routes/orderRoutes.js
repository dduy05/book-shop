const { Router } = require('express');
const {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getAllOrders
} = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = Router();

// Routes cho user
router.get('/', verifyToken, getUserOrders);
router.get('/:id', verifyToken, getOrderById);
router.post('/', verifyToken, createOrder);

// Routes cho admin
router.put('/:id/status', verifyToken, isAdmin, updateOrderStatus);
router.get('/admin/all', verifyToken, isAdmin, getAllOrders);

module.exports = router;