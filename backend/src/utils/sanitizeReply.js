function sanitizeReply(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/```/g, '')
    .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/As an AI(?: assistant| language model)?,?\s*/gi, '')
    .replace(/I('m| am) an AI(?: assistant)?,?\s*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { sanitizeReply };
