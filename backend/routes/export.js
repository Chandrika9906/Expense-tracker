const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const exportController = require('../controllers/exportController');

router.get('/', auth, exportController.exportData);

module.exports = router;
