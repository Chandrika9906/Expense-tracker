const express = require('express');
const { getAdvancedFinancialInsights, getBudgetRollovers } = require('../controllers/advancedController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/insights', auth, getAdvancedFinancialInsights);
router.get('/rollovers', auth, getBudgetRollovers);

module.exports = router;
