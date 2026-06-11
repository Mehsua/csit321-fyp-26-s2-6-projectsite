const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { generate, getPlan, deletePlanItem, addItem } = require('../controllers/mealPlanController');

const authRequired = [authenticate, requireRole(['registered', 'admin'])];

router.post('/generate', ...authRequired, generate);
router.get('/', ...authRequired, getPlan);
router.delete('/items/:itemId', ...authRequired, deletePlanItem);
router.post('/items', ...authRequired, addItem);

module.exports = router;
