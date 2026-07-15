const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const {
  getPreferences, setPreferences,
  getFavourites, addFavourite, removeFavourite,
  getTasteProfile, setTasteProfile,
  getMedicalProfile, setMedicalProfile,
} = require('../controllers/userController');

const authRegistered = [authenticate, requireRole(['registered', 'admin'])];

router.get('/me/preferences', ...authRegistered, getPreferences);
router.put('/me/preferences', ...authRegistered, setPreferences);
router.get('/me/favourites', ...authRegistered, getFavourites);
router.post('/me/favourites', ...authRegistered, addFavourite);
router.delete('/me/favourites/:recipeId', ...authRegistered, removeFavourite);
router.get('/me/taste-profile', ...authRegistered, getTasteProfile);
router.put('/me/taste-profile', ...authRegistered, setTasteProfile);
router.get('/me/medical-profile', ...authRegistered, getMedicalProfile);
router.put('/me/medical-profile', ...authRegistered, setMedicalProfile);

module.exports = router;
