const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.use(requireAuth);
router.get('/', notificationController.getMyNotifications);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
