const { Router } = require('express');
const { register, login, changePassword } = require('../controllers/authController');

const router = Router();

router.post('/register', register);

router.post('/login', login);

router.post('/change-password', changePassword);

module.exports = router;
