const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');

const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

// Public routes
router.get('/', postController.getPublicPosts); // Lấy danh sách bài viết đã duyệt

// User routes
router.post('/', verifyToken, upload.single('image'), postController.createPost); // Tạo bài mới
router.get('/mine', verifyToken, postController.getMyPosts); // Lấy bài của user
router.get('/:id', postController.getPostById); // Xem chi tiết bài viết đã duyệt
router.put('/:id', verifyToken, upload.single('image'), postController.updatePost); // Chỉnh sửa lại bài (sau khi bị rejected)
router.delete('/:id', verifyToken, postController.deleteMyPost); // Xóa bài của owner

// Admin routes
router.get('/admin/all', verifyToken, isAdmin, postController.getAllPostsAdmin); // Lấy tất cả bài để quản lý
router.get('/admin/:id', verifyToken, isAdmin, postController.getAdminPostById); // Xem chi tiết bài admin
router.put('/admin/:id/approve', verifyToken, isAdmin, postController.approvePost); // Duyệt bài
router.put('/admin/:id/reject', verifyToken, isAdmin, postController.rejectPost); // Từ chối với lý do
router.delete('/admin/:id', verifyToken, isAdmin, postController.deletePost); // Xóa bài

module.exports = router;
