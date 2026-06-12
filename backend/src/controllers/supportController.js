const SupportService = require('../services/SupportService');

async function query(req, res, next) {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const service = new SupportService();
    const result = await service.queryFAQ(message.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function escalate(req, res, next) {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const service = new SupportService();
    const userId = req.user?.user_id || null;
    const result = await service.createSupportRequest(userId, message.trim());
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { query, escalate };
