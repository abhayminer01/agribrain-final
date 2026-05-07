const router = require('express').Router();
const authController = require('./auth.controller');

router.post('/register', authController.registerUser);
router.post('/register-expert', authController.registerExpert);
router.post('/login', authController.loginUser);
router.post('/logout', authController.logoutUser);
router.get('/me', authController.checkSession);

module.exports = router;