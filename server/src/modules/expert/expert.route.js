const express = require('express');
const router = express.Router();
const expertController = require('./expert.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

router.post('/ask', requireAuth, requireRole(['Farmer']), expertController.askQuery);
router.get('/queries', requireAuth, expertController.getAllQueries);
router.post('/respond/:id', requireAuth, requireRole(['Expert', 'Admin']), expertController.respondToQuery);

module.exports = router;
