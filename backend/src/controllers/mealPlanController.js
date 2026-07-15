const MealPlanService = require('../services/MealPlanService');

async function generate(req, res, next) {
  try {
    const { sessionIngredients = [], numDays = 3 } = req.body;
    if (!Array.isArray(sessionIngredients)) {
      return res.status(400).json({ error: 'sessionIngredients must be an array' });
    }
    const parsedDays = parseInt(numDays, 10);
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 3) {
      return res.status(400).json({ error: 'numDays must be 1, 2, or 3' });
    }
    const service = new MealPlanService();
    const plan = await service.generateAndSavePlan(req.user.user_id, sessionIngredients, parsedDays);
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
}

async function getPlan(req, res, next) {
  try {
    const service = new MealPlanService();
    const plan = await service.getPlan(req.user.user_id);
    if (!plan) return res.status(200).json({ plan: null });
    res.status(200).json({ plan });
  } catch (err) {
    next(err);
  }
}

async function deletePlanItem(req, res, next) {
  try {
    const service = new MealPlanService();
    await service.deletePlanItem(req.user.user_id, req.params.itemId);
    res.status(204).send();
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { recipeId, dayNumber = 1 } = req.body;
    if (!recipeId) return res.status(400).json({ error: 'recipeId is required' });
    const service = new MealPlanService();
    const planId = await service.addItemToPlan(req.user.user_id, recipeId, dayNumber);
    res.status(201).json({ plan_id: planId });
  } catch (err) {
    next(err);
  }
}

module.exports = { generate, getPlan, deletePlanItem, addItem };
