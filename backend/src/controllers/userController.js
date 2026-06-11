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

module.exports = { getPreferences, setPreferences, getFavourites, addFavourite, removeFavourite };
