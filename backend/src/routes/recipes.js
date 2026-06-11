const express = require('express');
const { getInstructions } = require('../controllers/recipeController');

const router = express.Router();

router.get('/:id/instructions', getInstructions);

module.exports = router;
