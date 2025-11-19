import { formatForCursor } from '../llmFormatter';
import { formatForChatGPT, formatForCursor } from '../llmFormatter';
import { formatGeneric } from '../llmFormatter';

// Test: test_formatForCursor_creates_cursor_prompt
// Verifies formatForCursor creates properly structured prompt for Cursor AI
import { formatForCursor } from '../llmFormatter';

describe('formatForCursor', () => {
  const sampleIssues = [
    {
      severity: 'error',
      category: 'complexity',
      description: 'Function too complex',
      file: 'src/test.ts',
      line: 10,
      suggestion: 'Break into smaller functions'
    },
    {
      severity: 'warning',
      category: 'style',
      description: 'Inconsistent naming',
      file: 'src/test.ts',
      line: 20,
      suggestion: 'Use camelCase'
    }
  ];

  it('should return formatted string', () => {
    const result = formatForCursor(sampleIssues);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include issue descriptions', () => {
    const result = formatForCursor(sampleIssues);

    expect(result).toContain('Function too complex');
    expect(result).toContain('Inconsistent naming');
  });

  it('should format as markdown', () => {
    const result = formatForCursor(sampleIssues);

    expect(result).toContain('#');
    expect(result).toContain('**');
    expect(result).toMatch(/\n/);
  });

  it('should include file paths', () => {
    const result = formatForCursor(sampleIssues);

    expect(result).toContain('src/test.ts');
  });

  it('should prioritize errors over warnings', () => {
    const result = formatForCursor(sampleIssues);

    const errorIndex = result.indexOf('Function too complex');
    const warningIndex = result.indexOf('Inconsistent naming');

    expect(errorIndex).toBeLessThan(warningIndex);
  });
});

// Test: test_formatForChatGPT_creates_chatgpt_prompt
// Verifies formatForChatGPT creates verbose prompt optimized for ChatGPT
import { formatForChatGPT, formatForCursor } from '../llmFormatter';

describe('formatForChatGPT', () => {
  const sampleIssues = [
    {
      severity: 'error',
      category: 'complexity',
      description: 'Function too complex',
      file: 'src/test.ts',
      line: 10,
      suggestion: 'Break into smaller functions'
    }
  ];

  it('should return formatted string', () => {
    const result = formatForChatGPT(sampleIssues);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should be more verbose than cursor format', () => {
    const chatgptResult = formatForChatGPT(sampleIssues);
    const cursorResult = formatForCursor(sampleIssues);

    expect(chatgptResult.length).toBeGreaterThan(cursorResult.length);
  });

  it('should include context sections', () => {
    const result = formatForChatGPT(sampleIssues);

    expect(result).toContain('Context');
    expect(result).toContain('Issue');
    expect(result).toContain('Suggestion');
  });

  it('should structure with headers', () => {
    const result = formatForChatGPT(sampleIssues);

    expect(result).toMatch(/##\s+/);
    expect(result).toMatch(/###\s+/);
  });
});

// Test: test_formatGeneric_creates_standard_markdown
// Verifies formatGeneric creates standard markdown format for any AI assistant
import { formatGeneric } from '../llmFormatter';

describe('formatGeneric', () => {
  const sampleIssues = [
    {
      severity: 'error',
      category: 'complexity',
      description: 'Function too complex',
      file: 'src/test.ts',
      line: 10,
      suggestion: 'Break into smaller functions'
    },
    {
      severity: 'warning',
      category: 'style',
      description: 'Inconsistent naming',
      file: 'src/utils.ts',
      line: 5,
      suggestion: 'Use camelCase'
    }
  ];

  it('should return markdown string', () => {
    const result = formatGeneric(sampleIssues);

    expect(typeof result).toBe('string');
    expect(result).toContain('#');
  });

  it('should include severity levels', () => {
    const result = formatGeneric(sampleIssues);

    expect(result).toContain('error');
    expect(result).toContain('warning');
  });

  it('should include file locations', () => {
    const result = formatGeneric(sampleIssues);

    expect(result).toContain('src/test.ts');
    expect(result).toContain('src/utils.ts');
  });

  it('should be human-readable', () => {
    const result = formatGeneric(sampleIssues);

    expect(result).toContain('Function too complex');
    expect(result).toContain('Break into smaller functions');
    expect(result).toMatch(/\n\n/);
  });

  it('should include line numbers', () => {
    const result = formatGeneric(sampleIssues);

    expect(result).toContain('10');
    expect(result).toContain('5');
  });
});
