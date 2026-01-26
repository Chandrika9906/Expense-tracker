const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload, smartReceiptScan } = require('../controllers/smartReceiptController');
const { generatePredictiveAlerts, dismissAlert } = require('../controllers/predictiveController');

// Smart Receipt Scanner Routes
router.post('/smart-receipt-scan', auth, upload.single('receipt'), smartReceiptScan);

// Predictive Alerts Routes
router.get('/predictive-alerts', auth, generatePredictiveAlerts);
router.post('/dismiss-alert/:alertId', auth, dismissAlert);

module.exports = router;