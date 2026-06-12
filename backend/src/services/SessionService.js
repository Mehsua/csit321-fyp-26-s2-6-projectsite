const { supabaseAdmin } = require('../db/supabase');

const SESSION_DURATION_MINUTES = 30;

class SessionService {
  async createGuestSession() {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MINUTES * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: null,
        expires_at: expiresAt,
        is_active: true,
      })
      .select('session_id, user_id, is_active, created_at, expires_at')
      .single();

    if (error) throw Object.assign(new Error('Failed to create session.'), { status: 500 });
    return data;
  }

  async createAuthSession(userId) {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MINUTES * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: userId,
        expires_at: expiresAt,
        is_active: true,
      })
      .select('session_id, user_id, is_active, created_at, expires_at')
      .single();

    if (error) throw Object.assign(new Error('Failed to create session.'), { status: 500 });
    return data;
  }

  async updateActivity(userId) {
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('sessions')
      .update({ last_activity: now })
      .eq('user_id', userId)
      .eq('is_active', true);
  }
}

module.exports = new SessionService();
