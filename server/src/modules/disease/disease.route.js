const express = require('express');
const router = express.Router();
const diseaseController = require('./disease.controller');
const multer = require('multer');
const { requireAuth } = require('../../middleware/auth.middleware');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const parts = file.originalname.split('.');
    const ext = parts.length > 1 ? '.' + parts.pop() : '';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

router.post('/detect', requireAuth, upload.single('image'), diseaseController.detect);
router.get('/', requireAuth, diseaseController.getHistory);

module.exports = router;
