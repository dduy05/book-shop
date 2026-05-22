const { Router } = require('express');
const { sendContactMessage } = require('../controllers/contactController');

const router = Router();

// POST /api/contact - Gửi tin nhắn liên hệ từ khách hàng
router.post('/', sendContactMessage);

module.exports = router;
