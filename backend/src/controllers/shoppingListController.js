const ShoppingListService = require('../services/ShoppingListService');

async function generate(req, res, next) {
  const { recipeId, sessionIngredients = [] } = req.body;
  if (!recipeId) return res.status(400).json({ error: 'recipeId is required' });
  if (!Array.isArray(sessionIngredients)) {
    return res.status(400).json({ error: 'sessionIngredients must be an array' });
  }
  try {
    const service = new ShoppingListService();
    const items = await service.generateMissingItems(recipeId, sessionIngredients);
    if (req.user?.role === 'registered' || req.user?.role === 'admin') {
      try {
        await service.saveList(req.user.user_id, items);
      } catch (saveErr) {
        console.error('saveList failed:', saveErr.message);
      }
    }
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function getList(req, res, next) {
  try {
    const service = new ShoppingListService();
    const result = await service.getList(req.user.user_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function clearList(req, res, next) {
  try {
    const service = new ShoppingListService();
    await service.clearList(req.user.user_id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { generate, getList, clearList };
