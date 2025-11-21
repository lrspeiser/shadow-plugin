import { estimateTokenCount } from '../tokens';
import { encode } from 'gpt-3-encoder';

describe('estimateTokenCount', () => {
  test('should return correct token count for simple text', () => {
    const text = 'Hello, world!';
    const result = estimateTokenCount(text);
    const expected = encode(text).length;
    expect(result).toBe(expected);
    expect(result).toBeGreaterThan(0);
  });

  test('should return 0 for empty string', () => {
    const result = estimateTokenCount('');
    expect(result).toBe(0);
  });

  test('should handle multi-line text', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const result = estimateTokenCount(text);
    const expected = encode(text).length;
    expect(result).toBe(expected);
    expect(result).toBeGreaterThan(0);
  });

  test('should handle text with special characters', () => {
    const text = 'Hello! @#$%^&*() 你好 🌟';
    const result = estimateTokenCount(text);
    const expected = encode(text).length;
    expect(result).toBe(expected);
    expect(result).toBeGreaterThan(0);
  });

  test('should handle long text', () => {
    const text = 'This is a longer piece of text that contains multiple sentences. '.repeat(10);
    const result = estimateTokenCount(text);
    const expected = encode(text).length;
    expect(result).toBe(expected);
    expect(result).toBeGreaterThan(100);
  });

  test('should handle text with code snippets', () => {
    const text = 'function test() {\n  return "hello";\n}';
    const result = estimateTokenCount(text);
    const expected = encode(text).length;
    expect(result).toBe(expected);
    expect(result).toBeGreaterThan(0);
  });

  test('should handle text with whitespace', () => {
    const text = '   spaces   and   tabs\t\t';
    const result = estimateTokenCount(text);
    const expected = encode(text).length;
    expect(result).toBe(expected);
    expect(result).toBeGreaterThan(0);
  });

  test('should handle unicode characters', () => {
    const text = 'Unicode: café, naïve, Zürich';
    const result = estimateTokenCount(text);
    const expected = encode(text).length;
    expect(result).toBe(expected);
    expect(result).toBeGreaterThan(0);
  });

  test('should be consistent for same input', () => {
    const text = 'Consistency test';
    const result1 = estimateTokenCount(text);
    const result2 = estimateTokenCount(text);
    expect(result1).toBe(result2);
  });

  test('should handle single character', () => {
    const text = 'a';
    const result = estimateTokenCount(text);
    expect(result).toBeGreaterThanOrEqual(1);
  });
});