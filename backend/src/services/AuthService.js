const { createClient } = require('@supabase/supabase-js');
const { supabaseAdmin } = require('../db/supabase');

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

class AuthService {
  async register({ email, password, name }) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      const msg = authError.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        throw Object.assign(new Error('Account already exists'), { status: 409 });
      }
      throw Object.assign(new Error('Registration failed: ' + msg), { status: 500 });
    }

    const authUserId = authData.user.id;

    const { data: userRow, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        user_id: authUserId,
        email,
        name,
        role: 'registered',
        fail_count: 0,
        is_active: true,
        is_locked: false,
      })
      .select('user_id, email, name, role')
      .single();

    if (dbError) {
      throw Object.assign(new Error('Failed to create user profile: ' + dbError.message), { status: 500 });
    }

    return userRow;
  }

  async login({ email, password }) {
    const { data: userRow, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('user_id, name, role, is_locked, lock_until, fail_count, is_active')
      .eq('email', email)
      .single();

    if (lookupError || !userRow) {
      throw { status: 401, message: 'Incorrect email or password' };
    }

    if (!userRow.is_active) {
      throw { status: 401, message: 'Account has been deactivated' };
    }

    if (userRow.is_locked) {
      if (userRow.lock_until && new Date(userRow.lock_until) > new Date()) {
        throw { status: 423, message: 'Account locked', lock_until: userRow.lock_until };
      }
      await supabaseAdmin
        .from('users')
        .update({ is_locked: false, fail_count: 0, lock_until: null })
        .eq('user_id', userRow.user_id);
      userRow.is_locked = false;
      userRow.fail_count = 0;
    }

    const signInClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: authData, error: authError } = await signInClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      const newFailCount = (userRow.fail_count || 0) + 1;
      const update = { fail_count: newFailCount };
      if (newFailCount >= LOCKOUT_ATTEMPTS) {
        update.is_locked = true;
        update.lock_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
      }
      await supabaseAdmin.from('users').update(update).eq('user_id', userRow.user_id);
      throw { status: 401, message: 'Incorrect email or password' };
    }

    await supabaseAdmin
      .from('users')
      .update({ fail_count: 0, is_locked: false, lock_until: null })
      .eq('user_id', userRow.user_id);

    return {
      access_token: authData.session.access_token,
      user: {
        user_id: userRow.user_id,
        email,
        name: userRow.name,
        role: userRow.role,
      },
    };
  }

  async logout(accessToken) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) return;

    await supabaseAdmin
      .from('sessions')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);
  }

  async getMe(userId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('user_id, email, name, role, is_active, created_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw Object.assign(new Error('User not found'), { status: 404 });
    }
    return data;
  }
}

module.exports = new AuthService();
