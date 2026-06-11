const express = require('express');
const { getInstructions, recommend, getById } = require('../controllers/recipeController');

const router = express.Router();

router.post('/recommend', recommend);
router.get('/:id/instructions', getInstructions);
router.get('/:id', getById);

module.exports = router;
