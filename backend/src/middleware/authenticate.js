const { supabaseAdmin } = require('../db/supabase');
const sessionService = require('../services/SessionService');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { data: userRow, error: dbError } = await supabaseAdmin
    .from('users')
    .select('user_id, email, name, role, is_locked, lock_until, is_active')
    .eq('user_id', user.id)
    .single();

  if (dbError || !userRow) {
    return res.status(401).json({ error: 'User account not found' });
  }

  if (!userRow.is_active) {
    return res.status(401).json({ error: 'Account has been deactivated' });
  }

  if (userRow.is_locked && userRow.lock_until && new Date(userRow.lock_until) > new Date()) {
    return res.status(401).json({ error: 'Account is locked', lock_until: userRow.lock_until });
  }

  req.user = {
    user_id: userRow.user_id,
    email: userRow.email,
    name: userRow.name,
    role: userRow.role,
  };

  sessionService.updateActivity(userRow.user_id).catch(() => {});

  next();
}

module.exports = authenticate;
