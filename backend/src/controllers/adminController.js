const AdminService = require('../services/AdminService');

const adminService = new AdminService();

async function getDashboard(req, res, next) {
  try {
    const [stats, recentRecipes, recentErrors] = await Promise.all([
      adminService.getDashboardStats(),
      adminService.getRecentRecipes(5),
      adminService.getRecentErrors(5),
    ]);
    res.json({ ...stats, recentRecipes, recentErrors });
  } catch (err) { next(err); }
}

async function listRecipes(req, res, next) {
  try {
    const { search = '', category = '', page = '1', page_size = '20' } = req.query;
    const result = await adminService.listRecipes({ search, category, page: parseInt(page, 10) || 1, pageSize: parseInt(page_size, 10) || 20 });
    res.json(result);
  } catch (err) { next(err); }
}

async function createRecipe(req, res, next) {
  try {
    const { name, description, category, cookingTime, servings, instructions, ingredientNames, dietaryTagNames, allergenNames, nutrition } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name is required' });
    const recipe = await adminService.createRecipe({
      name: name.trim(), description, category, cookingTime, servings, instructions,
      ingredientNames: Array.isArray(ingredientNames) ? ingredientNames : [],
      dietaryTagNames: Array.isArray(dietaryTagNames) ? dietaryTagNames : [],
      allergenNames: Array.isArray(allergenNames) ? allergenNames : [],
      nutrition,
    });
    res.status(201).json({ recipe });
  } catch (err) { next(err); }
}

async function updateRecipe(req, res, next) {
  try {
    await adminService.updateRecipe(req.params.id, req.body);
    res.json({ message: 'Recipe updated' });
  } catch (err) { next(err); }
}

async function deleteRecipe(req, res, next) {
  try {
    await adminService.deleteRecipe(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

async function listUsers(req, res, next) {
  try {
    const { search = '', role = '', status = '', page = '1', page_size = '20' } = req.query;
    const result = await adminService.listUsers({ search, role, status, page: parseInt(page, 10) || 1, pageSize: parseInt(page_size, 10) || 20 });
    res.json(result);
  } catch (err) { next(err); }
}

async function lockUser(req, res, next) {
  try { await adminService.lockUser(req.params.id); res.json({ message: 'User locked' }); }
  catch (err) { next(err); }
}

async function unlockUser(req, res, next) {
  try { await adminService.unlockUser(req.params.id); res.json({ message: 'User unlocked' }); }
  catch (err) { next(err); }
}

async function deactivateUser(req, res, next) {
  try { await adminService.deactivateUser(req.params.id); res.json({ message: 'User deactivated' }); }
  catch (err) { next(err); }
}

async function reactivateUser(req, res, next) {
  try { await adminService.reactivateUser(req.params.id); res.json({ message: 'User reactivated' }); }
  catch (err) { next(err); }
}

async function listErrorLogs(req, res, next) {
  try {
    const { type = '', status = '', search = '', page = '1', page_size = '20' } = req.query;
    const result = await adminService.getErrorLogs({ type, status, search, page: parseInt(page, 10) || 1, pageSize: parseInt(page_size, 10) || 20 });
    res.json(result);
  } catch (err) { next(err); }
}

async function resolveErrorLog(req, res, next) {
  try { await adminService.resolveErrorLog(req.params.id); res.json({ message: 'Error log resolved' }); }
  catch (err) { next(err); }
}

async function clearResolvedLogs(req, res, next) {
  try { await adminService.clearResolvedLogs(); res.status(204).send(); }
  catch (err) { next(err); }
}

module.exports = {
  getDashboard, listRecipes, createRecipe, updateRecipe, deleteRecipe,
  listUsers, lockUser, unlockUser, deactivateUser, reactivateUser,
  listErrorLogs, resolveErrorLog, clearResolvedLogs,
};
