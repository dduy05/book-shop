const { Router } = require('express');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = Router();

// Tất cả routes đều yêu cầu admin
router.get('/', verifyToken, isAdmin, getAllUsers);
router.get('/:id', verifyToken, isAdmin, getUserById);
router.put('/:id/role', verifyToken, isAdmin, updateUserRole);
router.put('/:id', verifyToken, isAdmin, updateUser);
router.delete('/:id', verifyToken, isAdmin, deleteUser);

module.exports = router;