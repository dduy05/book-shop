const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/best-selling', statsController.getBestSelling);
router.get('/monthly-revenue', verifyToken, isAdmin, statsController.getMonthlyRevenue);

module.exports = router;
