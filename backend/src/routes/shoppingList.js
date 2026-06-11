const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { generate, getList, clearList } = require('../controllers/shoppingListController');
const { supabaseAdmin } = require('../db/supabase');

const router = Router();

const authRegistered = [authenticate, requireRole(['registered', 'admin'])];

router.post('/generate', optionalAuth, generate);
router.get('/', ...authRegistered, getList);
router.delete('/', ...authRegistered, clearList);

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  const token = authHeader.slice(7);
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && user) {
      const { data: userRow } = await supabaseAdmin
        .from('users')
        .select('user_id, email, name, role, is_locked, lock_until, is_active')
        .eq('user_id', user.id)
        .single();
      const VALID_ROLES = ['guest', 'registered', 'admin'];
      if (
        userRow &&
        userRow.is_active &&
        VALID_ROLES.includes(userRow.role) &&
        !(userRow.is_locked && userRow.lock_until && new Date(userRow.lock_until) > new Date())
      ) {
        req.user = {
          user_id: userRow.user_id,
          email: userRow.email,
          name: userRow.name,
          role: userRow.role,
        };
      }
    }
  } catch (_) {}
  next();
}

module.exports = router;
