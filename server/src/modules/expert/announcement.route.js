const express = require('express');
const router = express.Router();
const announcementController = require('./announcement.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

// Public to all authenticated users
router.get('/', requireAuth, announcementController.getAnnouncements);

// Restricted to Experts and Admins
router.post('/', requireAuth, requireRole(['Expert', 'Admin']), announcementController.createAnnouncement);

module.exports = router;
