const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const {
  getDashboard, listRecipes, createRecipe, updateRecipe, deleteRecipe,
  listUsers, lockUser, unlockUser, deactivateUser, reactivateUser, resetPassword,
  getRegistrationStats,
  listErrorLogs, resolveErrorLog, clearResolvedLogs,
} = require('../controllers/adminController');

const authAdmin = [authenticate, requireRole('admin')];

router.get('/dashboard', ...authAdmin, getDashboard);
router.get('/stats/registrations', ...authAdmin, getRegistrationStats);

router.get('/recipes', ...authAdmin, listRecipes);
router.post('/recipes', ...authAdmin, createRecipe);
router.put('/recipes/:id', ...authAdmin, updateRecipe);
router.delete('/recipes/:id', ...authAdmin, deleteRecipe);

router.get('/users', ...authAdmin, listUsers);
router.put('/users/:id/lock', ...authAdmin, lockUser);
router.put('/users/:id/unlock', ...authAdmin, unlockUser);
router.patch('/users/:id/deactivate', ...authAdmin, deactivateUser);
router.patch('/users/:id/reactivate', ...authAdmin, reactivateUser);
router.post('/users/:id/reset-password', ...authAdmin, resetPassword);

// Spec Section 4.8: GET /api/admin/logs, PATCH /api/admin/logs/:id
router.delete('/logs/resolved', ...authAdmin, clearResolvedLogs);
router.get('/logs', ...authAdmin, listErrorLogs);
router.patch('/logs/:id', ...authAdmin, resolveErrorLog);

module.exports = router;
