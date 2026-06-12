const { supabaseAdmin } = require('../db/supabase');

const SUPPORT_CONTACT = process.env.SUPPORT_EMAIL || 'support@foodbot.com';

const STOP_WORDS = new Set([
  'this', 'that', 'what', 'when', 'where', 'which', 'with', 'from', 'have', 'does',
  'will', 'they', 'them', 'their', 'about', 'more', 'some', 'such', 'than', 'then',
  'these', 'those', 'would', 'could', 'should', 'there', 'here', 'just', 'also',
  'only', 'like', 'make', 'your', 'into', 'been', 'much', 'most', 'each', 'were',
  'want', 'dont', 'cant', 'isnt', 'arent',
]);

class SupportService {
  async queryFAQ(message) {
    const { data: entries, error } = await supabaseAdmin
      .from('faq_entries')
      .select('faq_id, question, answer, category')
      .eq('is_active', true);

    if (error || !entries?.length) return { matched: false };

    const msgWords = message
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w));

    if (!msgWords.length) return { matched: false };

    let bestMatch = null;
    let bestScore = 0;

    for (const entry of entries) {
      const entryText = `${entry.question} ${entry.answer}`.toLowerCase();
      const score = msgWords.filter(w => entryText.includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestScore < 1) return { matched: false };

    return {
      matched: true,
      faq_id: bestMatch.faq_id,
      question: bestMatch.question,
      answer: bestMatch.answer,
      category: bestMatch.category,
    };
  }

  async createSupportRequest(userId, message) {
    const { data, error } = await supabaseAdmin
      .from('support_requests')
      .insert({ user_id: userId || null, message, status: 'open' })
      .select('request_id')
      .single();

    if (error || !data) throw new Error('Failed to create support request');

    return { request_id: data.request_id, contact_info: SUPPORT_CONTACT };
  }
}

module.exports = SupportService;
