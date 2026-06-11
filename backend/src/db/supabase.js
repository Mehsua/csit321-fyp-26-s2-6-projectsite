const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_KEY');
}

const authOptions = { auth: { persistSession: false, autoRefreshToken: false } };

const supabase = createClient(url, anonKey, authOptions);
const supabaseAdmin = createClient(url, serviceKey, authOptions);

module.exports = { supabase, supabaseAdmin };
