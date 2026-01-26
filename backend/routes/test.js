const express = require('express');
const { seedTestData, clearTestData } = require('../controllers/testController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/seed', auth, seedTestData);
router.post('/clear', auth, clearTestData);

module.exports = router;
