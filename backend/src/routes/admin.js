const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const {
  getDashboard, listRecipes, createRecipe, updateRecipe, deleteRecipe,
  listUsers, lockUser, unlockUser, deactivateUser, reactivateUser,
  listErrorLogs, resolveErrorLog, clearResolvedLogs,
} = require('../controllers/adminController');

const authAdmin = [authenticate, requireRole('admin')];

router.get('/dashboard', ...authAdmin, getDashboard);

router.get('/recipes', ...authAdmin, listRecipes);
router.post('/recipes', ...authAdmin, createRecipe);
router.put('/recipes/:id', ...authAdmin, updateRecipe);
router.delete('/recipes/:id', ...authAdmin, deleteRecipe);

router.get('/users', ...authAdmin, listUsers);
router.put('/users/:id/lock', ...authAdmin, lockUser);
router.put('/users/:id/unlock', ...authAdmin, unlockUser);
router.put('/users/:id/deactivate', ...authAdmin, deactivateUser);
router.put('/users/:id/reactivate', ...authAdmin, reactivateUser);

router.get('/error-logs', ...authAdmin, listErrorLogs);
router.put('/error-logs/:id/resolve', ...authAdmin, resolveErrorLog);
router.delete('/error-logs/resolved', ...authAdmin, clearResolvedLogs);

module.exports = router;
