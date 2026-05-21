const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  updateBookQuantity,
  deleteBook,
} = require('../controllers/bookController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({ storage });

const router = Router();

router.get('/', getAllBooks);

router.get('/:id', getBookById);

router.post('/', verifyToken, isAdmin, upload.single('image'), createBook);

router.put('/:id', verifyToken, isAdmin, upload.single('image'), updateBook);

router.patch('/:id/quantity', verifyToken, updateBookQuantity);

router.delete('/:id', verifyToken, isAdmin, deleteBook);

module.exports = router;
