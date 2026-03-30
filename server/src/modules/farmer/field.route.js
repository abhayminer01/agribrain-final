const router = require('express').Router();
const fieldController = require('./field.controller');
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

router.use(requireAuth);

router.post('/analyze-soil', upload.single('soilReport'), fieldController.analyzeSoilBeforeCreate);
router.post('/', upload.single('image'), fieldController.createField);
router.get('/', fieldController.getFields);
router.put('/:id/plant', fieldController.markPlanted);
router.put('/:id/schedule/:stageIndex/select', fieldController.updateSchedulePreference);
router.put('/:id/schedule/:stageIndex/apply', fieldController.applySchedulePhase);

module.exports = router;
