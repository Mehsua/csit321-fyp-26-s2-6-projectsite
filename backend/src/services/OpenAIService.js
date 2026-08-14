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

  async generateRecipe({ ingredients = [], dietaryTags = [], allergenNames = [] } = {}) {
    try {
      const constraints = [
        dietaryTags.length > 0 ? `The recipe must satisfy these dietary requirements: ${dietaryTags.join(', ')}.` : '',
        allergenNames.length > 0 ? `The recipe must NOT contain these allergens: ${allergenNames.join(', ')}.` : '',
      ].filter(Boolean).join(' ');

      const response = await this.client.chat.completions.create({
        model: 'gpt-4.1-nano-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a recipe creation assistant for a food app. Given a list of ingredients, invent one realistic recipe that uses them. Respond with JSON only, matching exactly this shape: {"name": string, "category": string, "cooking_time": number (minutes), "servings": number, "instructions": string (numbered steps separated by newlines), "ingredients": [{"name": string, "quantity": number, "unit": string, "category": one of "Produce","Dairy","Pantry","Meat","Seafood","Other"}], "dietary_tags": array of zero or more of "GlutenFree","Halal","Vegan","Vegetarian" that genuinely apply, "allergens": array of zero or more of "Dairy","Eggs","Gluten","Peanuts","Shellfish","Soy" that are genuinely present, "nutrition": {"calories": number, "protein_g": number, "carbs_g": number, "fats_g": number, "fibre_g": number} (your best estimate per serving). ${constraints} Return only the JSON object, nothing else.`
          },
          { role: 'user', content: `Ingredients available: ${ingredients.join(', ')}` }
        ],
        temperature: 0.5
      });

      const raw = response.choices[0].message.content;
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return null;

      const parsed = JSON.parse(match[0]);
      if (!parsed.name || !Array.isArray(parsed.ingredients) || parsed.ingredients.length === 0) return null;

      const validCategories = ['Produce', 'Dairy', 'Pantry', 'Meat', 'Seafood', 'Other'];
      const validDietaryTags = ['GlutenFree', 'Halal', 'Vegan', 'Vegetarian'];
      const validAllergens = ['Dairy', 'Eggs', 'Gluten', 'Peanuts', 'Shellfish', 'Soy'];
      return {
        name: String(parsed.name),
        category: parsed.category ? String(parsed.category) : null,
        cooking_time: Number.isFinite(parsed.cooking_time) ? parsed.cooking_time : null,
        servings: Number.isFinite(parsed.servings) ? parsed.servings : null,
        instructions: sanitizeReply(String(parsed.instructions || '')),
        ingredients: parsed.ingredients
          .filter(i => i && typeof i.name === 'string' && i.name.trim())
          .map(i => ({
            name: i.name.trim().toLowerCase(),
            category: validCategories.includes(i.category) ? i.category : 'Other',
          })),
        dietary_tags: Array.isArray(parsed.dietary_tags) ? parsed.dietary_tags.filter(t => typeof t === 'string' && validDietaryTags.includes(t)) : [],
        allergens: Array.isArray(parsed.allergens) ? parsed.allergens.filter(a => typeof a === 'string' && validAllergens.includes(a)) : [],
        nutrition: parsed.nutrition && typeof parsed.nutrition === 'object'
          ? {
              calories: Number.isFinite(parsed.nutrition.calories) ? parsed.nutrition.calories : null,
              protein_g: Number.isFinite(parsed.nutrition.protein_g) ? parsed.nutrition.protein_g : null,
              carbs_g: Number.isFinite(parsed.nutrition.carbs_g) ? parsed.nutrition.carbs_g : null,
              fats_g: Number.isFinite(parsed.nutrition.fats_g) ? parsed.nutrition.fats_g : null,
              fibre_g: Number.isFinite(parsed.nutrition.fibre_g) ? parsed.nutrition.fibre_g : null,
            }
          : null,
      };
    } catch {
      return null;
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
