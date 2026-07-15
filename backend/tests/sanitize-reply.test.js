const { sanitizeReply } = require('../src/utils/sanitizeReply');

describe('sanitizeReply', () => {
  test('strips markdown bold', () => {
    expect(sanitizeReply('This is **bold** text')).toBe('This is bold text');
  });

  test('strips markdown italic', () => {
    expect(sanitizeReply('This is *italic* text')).toBe('This is italic text');
  });

  test('strips markdown headers', () => {
    expect(sanitizeReply('## Section Title\nContent here')).toBe('Section Title\nContent here');
  });

  test('strips inline code spans', () => {
    expect(sanitizeReply('Use `npm install` to install')).toBe('Use npm install to install');
  });

  test('removes AI self-references', () => {
    expect(sanitizeReply('As an AI, I can help you.')).toBe('I can help you.');
  });

  test('collapses 3+ newlines to 2', () => {
    expect(sanitizeReply('Line 1\n\n\n\nLine 2')).toBe('Line 1\n\nLine 2');
  });

  test('returns empty string for null', () => {
    expect(sanitizeReply(null)).toBe('');
    expect(sanitizeReply(undefined)).toBe('');
  });
});
