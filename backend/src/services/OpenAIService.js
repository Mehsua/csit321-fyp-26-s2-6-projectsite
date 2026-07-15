const { OpenAI } = require('openai');
const { sanitizeReply } = require('../utils/sanitizeReply');

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async extractIngredients(text) {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4.1-nano-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Extract all food ingredient names from the user text. Return a JSON array of ingredient names only. Normalise plurals (e.g. tomatoes → tomato). Ignore quantities and units. Return only the JSON array, nothing else.'
          },
          { role: 'user', content: text }
        ],
        temperature: 0
      });

      const raw = response.choices[0].message.content;
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return [];
      return JSON.parse(match[0]);
    } catch {
      return [];
    }
  }

  async generateCookingInstructions(recipeName) {
    const safeName = String(recipeName).replace(/[\r\n]/g, ' ').slice(0, 100);
    const response = await this.client.chat.completions.create({
      model: 'gpt-4.1-nano-2025-04-14',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful cooking assistant. Provide clear, numbered step-by-step cooking instructions. Be concise and practical.'
        },
        {
          role: 'user',
          content: `Provide step-by-step cooking instructions for: ${safeName}`
        }
      ],
      temperature: 0.3
    });

    return sanitizeReply(response.choices[0].message.content);
  }

  async chat(messages) {
    const systemMessage = {
      role: 'system',
      content: `You are FoodBot, a friendly AI food assistant. You help users find recipes based on their ingredients, answer cooking questions, and provide customer support for the FoodBot app.

Guidelines:
- Be concise and friendly
- For ingredient queries, acknowledge recipe matches briefly and offer further help
- For cooking questions, give practical advice
- For app support questions, explain clearly
- Keep responses under 3 sentences unless detailed instructions are needed
- Never include PII or personal data in responses`
    };

    const response = await this.client.chat.completions.create({
      model: 'gpt-4.1-nano-2025-04-14',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 300
    });

    return sanitizeReply(response.choices[0].message.content);
  }
}

module.exports = OpenAIService;
