import { formatForCursor } from '../llmFormatter';
import { formatForChatGPT } from '../llmFormatter';
import { formatGeneric } from '../llmFormatter';

// Test: test_formatForCursor_generates_optimized_prompt
// Verifies Cursor-specific prompt formatting includes compact structure
import { formatForCursor } from '../llmFormatter';

describe('llmFormatter.formatForCursor', () => {
  test('generates optimized prompt for Cursor', () => {
    const issues = [
      {
        severity: 'error',
        category: 'Code Organization',
        description: 'God object detected',
        file: 'src/large.ts',
        line: 1,
        suggestedFix: 'Split into smaller modules'
      }
    ];
    
    const prompt = formatForCursor(issues);
    
    expect(prompt).toContain('## Architecture Issues');
    expect(prompt).toContain('src/large.ts');
    expect(prompt).toContain('Split into smaller modules');
  });

  test('groups issues by severity', () => {
    const issues = [
      { severity: 'error', category: 'Code Organization', description: 'Error 1', file: 'file1.ts', line: 1 },
      { severity: 'warning', category: 'Dependencies', description: 'Warning 1', file: 'file2.ts', line: 1 }
    ];
    
    const prompt = formatForCursor(issues);
    
    expect(prompt).toContain('error');
    expect(prompt).toContain('warning');
    expect(prompt.indexOf('error')).toBeLessThan(prompt.indexOf('warning'));
  });

  test('handles empty issues array', () => {
    const issues: any[] = [];
    
    const prompt = formatForCursor(issues);
    
    expect(prompt).toContain('No issues detected');
  });
});

// Test: test_formatForChatGPT_generates_verbose_prompt
// Verifies ChatGPT-specific prompt formatting includes detailed context
import { formatForChatGPT } from '../llmFormatter';

describe('llmFormatter.formatForChatGPT', () => {
  test('generates verbose prompt for ChatGPT', () => {
    const issues = [
      {
        severity: 'warning',
        category: 'Complexity',
        description: 'Function too complex',
        file: 'src/complex.ts',
        line: 50,
        suggestedFix: 'Refactor into smaller functions'
      }
    ];
    
    const prompt = formatForChatGPT(issues);
    
    expect(prompt).toContain('Function too complex');
    expect(prompt).toContain('src/complex.ts');
    expect(prompt).toContain('Refactor');
    expect(prompt.length).toBeGreaterThan(200);
  });

  test('includes detailed context sections', () => {
    const issues = [{ severity: 'error', category: 'Code Organization', description: 'Test', file: 'test.ts', line: 1 }];
    
    const prompt = formatForChatGPT(issues);
    
    expect(prompt).toContain('Architecture Analysis');
    expect(prompt).toContain('Issues Detected');
  });

  test('formats code examples with markdown', () => {
    const issues = [
      {
        severity: 'info',
        category: 'Style',
        description: 'Code style issue',
        file: 'src/style.ts',
        line: 10,
        codeSnippet: 'const x = 1;'
      }
    ];
    
    const prompt = formatForChatGPT(issues);
    
    expect(prompt).toContain('');
  });
});

// Test: test_formatGeneric_generates_standard_markdown
// Verifies generic prompt formatting produces standard markdown
import { formatGeneric } from '../llmFormatter';

describe('llmFormatter.formatGeneric', () => {
  test('generates standard markdown prompt', () => {
    const issues = [
      {
        severity: 'error',
        category: 'Dependencies',
        description: 'Circular dependency',
        file: 'src/module.ts',
        line: 1
      }
    ];
    
    const prompt = formatGeneric(issues);
    
    expect(prompt).toContain('#');
    expect(prompt).toContain('Circular dependency');
    expect(prompt).toContain('src/module.ts');
  });

  test('avoids assistant-specific syntax', () => {
    const issues = [{ severity: 'warning', category: 'Code Organization', description: 'Test', file: 'test.ts', line: 1 }];
    
    const prompt = formatGeneric(issues);
    
    expect(prompt).not.toContain('@cursor');
    expect(prompt).not.toContain('ChatGPT');
  });

  test('organizes issues by category', () => {
    const issues = [
      { severity: 'error', category: 'Code Organization', description: 'Issue 1', file: 'file1.ts', line: 1 },
      { severity: 'warning', category: 'Code Organization', description: 'Issue 2', file: 'file2.ts', line: 1 }
    ];
    
    const prompt = formatGeneric(issues);
    
    expect(prompt).toContain('Code Organization');
  });
});
