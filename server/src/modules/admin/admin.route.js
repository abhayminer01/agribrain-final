const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

router.use(requireAuth, requireRole(['Admin']));

router.get('/users', adminController.getUsers);
router.put('/verify-expert/:userId', adminController.verifyExpert);
router.get('/stats', adminController.getStats);

module.exports = router;
