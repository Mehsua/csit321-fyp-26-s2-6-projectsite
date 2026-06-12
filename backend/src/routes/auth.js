const { Router } = require('express');
const { register, login, logout, getMe, forgotPassword } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', forgotPassword);

module.exports = router;
