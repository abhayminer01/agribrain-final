const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

router.use(requireAuth, requireRole(['Admin']));

// User Management
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/verify-expert/:userId', adminController.verifyExpert);

// Field Management
router.get('/fields', adminController.getFields);
router.put('/fields/:id', adminController.updateField);
router.delete('/fields/:id', adminController.deleteField);

// Query Management
router.get('/queries', adminController.getQueries);
router.put('/queries/:id', adminController.updateQuery);
router.delete('/queries/:id', adminController.deleteQuery);

// Announcement Management
router.get('/announcements', adminController.getAnnouncements);
router.put('/announcements/:id', adminController.updateAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

// Stats
router.get('/stats', adminController.getStats);

module.exports = router;
