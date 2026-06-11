const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const {
  getPreferences, setPreferences,
  getFavourites, addFavourite, removeFavourite,
} = require('../controllers/userController');

const authRegistered = [authenticate, requireRole(['registered', 'admin'])];

router.get('/me/preferences', ...authRegistered, getPreferences);
router.put('/me/preferences', ...authRegistered, setPreferences);
router.get('/me/favourites', ...authRegistered, getFavourites);
router.post('/me/favourites', ...authRegistered, addFavourite);
router.delete('/me/favourites/:recipeId', ...authRegistered, removeFavourite);

module.exports = router;
