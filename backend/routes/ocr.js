const express = require('express');
const { upload, processReceiptImage, createExpenseFromOCR } = require('../controllers/ocrController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// Process image and return extracted data (preview)
router.post('/extract', upload.single('image'), processReceiptImage);

// Process image and create expense directly
router.post('/create-expense', upload.single('image'), createExpenseFromOCR);

module.exports = router;