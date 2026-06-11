const express = require('express');
const { extractIngredients, chat } = require('../controllers/chatController');

const router = express.Router();

router.post('/extract-ingredients', extractIngredients);
router.post('/', chat);

module.exports = router;
