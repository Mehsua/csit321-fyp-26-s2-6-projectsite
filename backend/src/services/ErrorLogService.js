const { supabaseAdmin } = require('../db/supabase');

class ErrorLogService {
  async logError({ userId = null, errorType, message, endpoint = null }) {
    const { error } = await supabaseAdmin
      .from('error_logs')
      .insert({ user_id: userId, error_type: errorType, message, endpoint });
    if (error) throw error;
  }
}

module.exports = new ErrorLogService();
