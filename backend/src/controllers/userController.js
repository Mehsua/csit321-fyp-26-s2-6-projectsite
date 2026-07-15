const UserService = require('../services/UserService');

function getUserService() {
  return new UserService();
}

async function getPreferences(req, res, next) {
  try {
    const data = await getUserService().getPreferences(req.user.user_id);
    res.json(data);
  } catch (err) { next(err); }
}

async function setPreferences(req, res, next) {
  try {
    const { dietaryTags, allergenNames } = req.body;
    if (!Array.isArray(dietaryTags) || !Array.isArray(allergenNames)) {
      return res.status(400).json({ error: 'dietaryTags and allergenNames must be arrays' });
    }
    await getUserService().setPreferences(req.user.user_id, { dietaryTags, allergenNames });
    res.json({ message: 'Preferences saved' });
  } catch (err) { next(err); }
}

async function getFavourites(req, res, next) {
  try {
    const data = await getUserService().getFavourites(req.user.user_id);
    res.json(data);
  } catch (err) { next(err); }
}

async function addFavourite(req, res, next) {
  try {
    const { recipeId, score } = req.body;
    if (!recipeId) return res.status(400).json({ error: 'recipeId is required' });
    await getUserService().addFavourite(req.user.user_id, recipeId, score ?? null);
    res.status(201).json({ message: 'Saved to favourites' });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
}

async function removeFavourite(req, res, next) {
  try {
    await getUserService().removeFavourite(req.user.user_id, req.params.recipeId);
    res.status(204).send();
  } catch (err) { next(err); }
}

async function getTasteProfile(req, res, next) {
  try {
    const data = await getUserService().getTasteProfile(req.user.user_id);
    res.json(data);
  } catch (err) { next(err); }
}

async function setTasteProfile(req, res, next) {
  try {
    const { preferredCuisines = [], spiceLevel = 'medium', maxCookingTime = null } = req.body;
    const VALID_SPICE = ['mild', 'medium', 'spicy'];
    const VALID_CUISINES = ['Asian', 'Western', 'Italian', 'Indian', 'Mediterranean', 'Mexican'];
    if (!VALID_SPICE.includes(spiceLevel)) {
      return res.status(400).json({ error: 'spiceLevel must be mild, medium, or spicy' });
    }
    if (!Array.isArray(preferredCuisines) || !preferredCuisines.every(c => VALID_CUISINES.includes(c))) {
      return res.status(400).json({ error: `preferredCuisines must be an array containing only: ${VALID_CUISINES.join(', ')}` });
    }
    if (maxCookingTime !== null && (typeof maxCookingTime !== 'number' || maxCookingTime < 1)) {
      return res.status(400).json({ error: 'maxCookingTime must be a positive number or null' });
    }
    await getUserService().setTasteProfile(req.user.user_id, { preferredCuisines, spiceLevel, maxCookingTime });
    res.json({ message: 'Taste profile saved' });
  } catch (err) { next(err); }
}

async function getMedicalProfile(req, res, next) {
  try {
    const conditions = await getUserService().getMedicalProfile(req.user.user_id);
    res.json({ conditions });
  } catch (err) { next(err); }
}

async function setMedicalProfile(req, res, next) {
  try {
    const { conditions } = req.body;
    const VALID = ['Diabetes', 'Hypertension', 'HeartDisease', 'WeightLoss'];
    if (!Array.isArray(conditions) || !conditions.every(c => VALID.includes(c))) {
      return res.status(400).json({ error: `conditions must be an array containing only: ${VALID.join(', ')}` });
    }
    await getUserService().setMedicalProfile(req.user.user_id, conditions);
    res.json({ message: 'Medical profile saved' });
  } catch (err) { next(err); }
}

module.exports = {
  getPreferences, setPreferences,
  getFavourites, addFavourite, removeFavourite,
  getTasteProfile, setTasteProfile,
  getMedicalProfile, setMedicalProfile,
};
