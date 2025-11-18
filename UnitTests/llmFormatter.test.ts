import { LLMFormatter } from '../llmFormatter';

// Test: test_formatForCursor_generatesOptimizedPrompt
// Verifies formatForCursor generates prompts optimized for Cursor AI assistant
import { LLMFormatter } from '../llmFormatter';

describe('LLMFormatter.formatForCursor', () => {
  let formatter: LLMFormatter;

  beforeEach(() => {
    formatter = new LLMFormatter();
  });

  test('generates Cursor-optimized prompt with context', () => {
    const insights = [
      {
        severity: 'error',
        category: 'god-object',
        description: 'File too large',
        file: 'src/service.ts',
        line: 1
      }
    ];

    const prompt = formatter.formatForCursor(insights);

    expect(prompt).toContain('src/service.ts');
    expect(prompt).toContain('god-object');
    expect(prompt).toContain('File too large');
  });

  test('includes code context in Cursor prompt', () => {
    const insights = [
      {
        severity: 'warning',
        category: 'complexity',
        description: 'High complexity',
        file: 'src/complex.ts',
        line: 50,
        codeSnippet: 'function complex() { ... }'
      }
    ];

    const prompt = formatter.formatForCursor(insights);

    expect(prompt).toContain('complex.ts');
    expect(prompt).toContain('complexity');
  });

  test('formats multiple issues correctly', () => {
    const insights = [
      { severity: 'error', category: 'god-object', description: 'Issue 1', file: 'a.ts' },
      { severity: 'warning', category: 'complexity', description: 'Issue 2', file: 'b.ts' }
    ];

    const prompt = formatter.formatForCursor(insights);

    expect(prompt).toContain('a.ts');
    expect(prompt).toContain('b.ts');
  });

  test('handles empty insights array', () => {
    const prompt = formatter.formatForCursor([]);

    expect(prompt).toBeDefined();
    expect(prompt.length).toBeGreaterThan(0);
  });
});

// Test: test_formatForChatGPT_generatesVerbosePrompt
// Verifies formatForChatGPT generates detailed prompts for ChatGPT
import { LLMFormatter } from '../llmFormatter';

describe('LLMFormatter.formatForChatGPT', () => {
  let formatter: LLMFormatter;

  beforeEach(() => {
    formatter = new LLMFormatter();
  });

  test('generates verbose ChatGPT prompt', () => {
    const insights = [
      {
        severity: 'error',
        category: 'circular-dependency',
        description: 'Circular import detected',
        file: 'src/a.ts'
      }
    ];

    const prompt = formatter.formatForChatGPT(insights);

    expect(prompt).toContain('circular-dependency');
    expect(prompt).toContain('src/a.ts');
    expect(prompt.length).toBeGreaterThan(100);
  });

  test('includes detailed explanations', () => {
    const insights = [
      {
        severity: 'warning',
        category: 'dead-code',
        description: 'Unused function',
        file: 'src/util.ts'
      }
    ];

    const prompt = formatter.formatForChatGPT(insights);

    expect(prompt).toContain('dead-code');
    expect(prompt).toContain('util.ts');
  });

  test('handles multiple severity levels', () => {
    const insights = [
      { severity: 'error', category: 'god-object', description: 'Large file', file: 'a.ts' },
      { severity: 'warning', category: 'complexity', description: 'Complex', file: 'b.ts' },
      { severity: 'info', category: 'style', description: 'Format', file: 'c.ts' }
    ];

    const prompt = formatter.formatForChatGPT(insights);

    expect(prompt).toContain('error');
    expect(prompt).toContain('warning');
    expect(prompt).toContain('info');
  });
});
