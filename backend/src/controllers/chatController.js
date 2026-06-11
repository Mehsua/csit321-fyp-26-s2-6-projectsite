const OpenAIService = require('../services/OpenAIService');

let openAIService = null;

function getOpenAIService() {
  if (!openAIService) {
    openAIService = new OpenAIService();
  }
  return openAIService;
}

function resetOpenAIService() {
  openAIService = null;
}

async function extractIngredients(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text is required and must be a non-empty string' });
    }

    const service = getOpenAIService();
    const ingredients = await service.extractIngredients(text.trim());
    return res.status(200).json({ ingredients });
  } catch (err) {
    next(err);
  }
}

async function chat(req, res, next) {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array' });
    }

    if (messages.length > 50) {
      return res.status(400).json({ error: 'messages array must not exceed 50 items' });
    }

    const isValidMessage = (m) =>
      m && typeof m === 'object' &&
      ['user', 'assistant'].includes(m.role) &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0 &&
      m.content.length <= 2000;

    if (!messages.every(isValidMessage)) {
      return res.status(400).json({ error: 'each message must have role (user or assistant) and non-empty string content (max 2000 chars)' });
    }

    const service = getOpenAIService();
    const reply = await service.chat(messages);
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(503).json({ error: 'AI service currently unavailable, please try again' });
  }
}

module.exports = { extractIngredients, chat, resetOpenAIService };
