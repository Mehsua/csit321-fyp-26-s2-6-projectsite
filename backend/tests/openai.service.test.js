jest.mock('openai', () => ({
  OpenAI: jest.fn()
}));

const { OpenAI } = require('openai');
const OpenAIService = require('../src/services/OpenAIService');

describe('OpenAIService.extractIngredients', () => {
  let mockCreate;
  let svc;

  beforeEach(() => {
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));
    svc = new OpenAIService();
  });

  afterEach(() => jest.clearAllMocks());

  it('returns normalised ingredient array from a clean JSON response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '["chicken","garlic","lemon"]' } }]
    });

    const result = await svc.extractIngredients('I have chicken, garlic and lemon');

    expect(result).toEqual(['chicken', 'garlic', 'lemon']);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini',
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user', content: 'I have chicken, garlic and lemon' })
      ])
    }));
  });

  it('returns ingredient array when OpenAI wraps JSON in a markdown code block', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '```json\n["tomato","basil","olive oil"]\n```' } }]
    });

    const result = await svc.extractIngredients('tomato basil olive oil');
    expect(result).toEqual(['tomato', 'basil', 'olive oil']);
  });

  it('returns empty array when response contains no valid JSON array', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Sorry, I cannot help with that.' } }]
    });

    const result = await svc.extractIngredients('hello');
    expect(result).toEqual([]);
  });

  it('returns empty array and does not throw on OpenAI API error', async () => {
    mockCreate.mockRejectedValue(new Error('API rate limit exceeded'));

    const result = await svc.extractIngredients('chicken and rice');
    expect(result).toEqual([]);
  });
});

describe('OpenAIService.generateCookingInstructions', () => {
  let mockCreate;
  let svc;

  beforeEach(() => {
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));
    svc = new OpenAIService();
  });

  afterEach(() => jest.clearAllMocks());

  it('returns a non-empty string of cooking steps', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '1. Preheat oven to 200°C.\n2. Season the chicken.' } }]
    });

    const result = await svc.generateCookingInstructions('Lemon Garlic Chicken');

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini',
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: expect.stringContaining('Lemon Garlic Chicken') })
      ])
    }));
  });

  it('throws when OpenAI API returns an error', async () => {
    mockCreate.mockRejectedValue(new Error('Service unavailable'));

    await expect(svc.generateCookingInstructions('Test Recipe')).rejects.toThrow('Service unavailable');
  });
});

describe('OpenAIService.chat', () => {
  let mockCreate;
  let svc;

  beforeEach(() => {
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));
    svc = new OpenAIService();
  });

  afterEach(() => jest.clearAllMocks());

  it('returns a reply string', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'I found 3 recipes that match your ingredients!' } }]
    });

    const result = await svc.chat([{ role: 'user', content: 'I have chicken and garlic' }]);

    expect(result).toBe('I found 3 recipes that match your ingredients!');
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini',
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user', content: 'I have chicken and garlic' })
      ])
    }));
  });

  it('passes entire conversation history to OpenAI', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Here are substitutions...' } }]
    });

    const history = [
      { role: 'user', content: 'I have chicken and rice' },
      { role: 'assistant', content: 'Try Chicken Fried Rice!' },
      { role: 'user', content: 'What can I substitute for rice?' }
    ];

    await svc.chat(history);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages.length).toBe(4); // system + 3 history messages
  });

  it('throws when OpenAI API returns an error', async () => {
    mockCreate.mockRejectedValue(new Error('API error'));

    await expect(svc.chat([{ role: 'user', content: 'hello' }])).rejects.toThrow('API error');
  });
});
