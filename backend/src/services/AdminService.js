const { supabaseAdmin } = require('../db/supabase');

class AdminService {
  async getDashboardStats() {
    const [recipesRes, usersRes, sessionsRes, errorsRes] = await Promise.all([
      supabaseAdmin.from('recipes').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'registered').eq('is_active', true),
      supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
      supabaseAdmin.from('error_logs').select('*', { count: 'exact', head: true }).eq('is_resolved', false),
    ]);
    if (recipesRes.error) throw recipesRes.error;
    if (usersRes.error) throw usersRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    if (errorsRes.error) throw errorsRes.error;
    return {
      totalRecipes: recipesRes.count ?? 0,
      registeredUsers: usersRes.count ?? 0,
      activeSessions: sessionsRes.count ?? 0,
      unresolvedErrors: errorsRes.count ?? 0,
    };
  }

  async getRecentRecipes(limit = 5) {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select('recipe_id, name, category, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async getRecentErrors(limit = 5) {
    const { data, error } = await supabaseAdmin
      .from('error_logs')
      .select('log_id, error_type, message, endpoint, user_id, is_resolved, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async getErrorLogs({ type = '', status = '', search = '', page = 1, pageSize = 20 } = {}) {
    let query = supabaseAdmin
      .from('error_logs')
      .select('log_id, error_type, message, endpoint, user_id, is_resolved, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (type) query = query.eq('error_type', type);
    if (status === 'open') query = query.eq('is_resolved', false);
    if (status === 'resolved') query = query.eq('is_resolved', true);
    if (search) query = query.ilike('message', `%${search}%`);
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    return { logs: data ?? [], total: count ?? 0 };
  }

  async resolveErrorLog(logId) {
    const { error } = await supabaseAdmin
      .from('error_logs')
      .update({ is_resolved: true })
      .eq('log_id', logId);
    if (error) throw error;
  }

  async clearResolvedLogs() {
    const { error } = await supabaseAdmin
      .from('error_logs')
      .delete()
      .eq('is_resolved', true);
    if (error) throw error;
  }
}

module.exports = AdminService;
