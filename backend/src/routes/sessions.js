const { Router } = require('express');
const { createSession } = require('../controllers/sessionController');
const { supabaseAdmin } = require('../db/supabase');

const router = Router();

router.post('/', optionalAuth, createSession);

// Unlike authenticate, this never returns 401 — any auth failure silently falls back to guest.
// Handles expired tokens in localStorage without breaking the session creation flow.
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.slice(7);
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && user) {
      const { data: userRow } = await supabaseAdmin
        .from('users')
        .select('user_id, email, name, role, is_locked, lock_until, is_active')
        .eq('user_id', user.id)
        .single();
      if (
        userRow &&
        userRow.is_active &&
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
  } catch (_) { }
  next();
}

module.exports = router;
