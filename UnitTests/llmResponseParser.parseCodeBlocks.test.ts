import { parseCodeBlocks } from '../llmResponseParser';

describe('parseCodeBlocks (for loop list parsing)', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  test('should parse simple list items with bullet points', () => {
    const input = `- First item
- Second item
- Third item`;
    const result = parseCodeBlocks(input);
    
    expect(result).toContain('First item');
    expect(result).toContain('Second item');
    expect(result).toContain('Third item');
  });

  test('should parse numbered list items', () => {
    const input = `1. First numbered item
2. Second numbered item
3) Third numbered item with parenthesis`;
    const result = parseCodeBlocks(input);
    
    expect(result).toContain('First numbered item');
    expect(result).toContain('Second numbered item');
    expect(result).toContain('Third numbered item with parenthesis');
  });

  test('should parse multi-line list items', () => {
    const input = `- First item
  continuation of first
  more continuation
- Second item
  continuation of second`;
    const result = parseCodeBlocks(input);
    
    expect(result).toContain('First item');
    expect(result).toContain('continuation of first');
    expect(result).toContain('Second item');
    expect(result).toContain('continuation of second');
  });

  test('should handle bullet point variations (asterisk, dash, dot)', () => {
    const input = `- Dash bullet
* Asterisk bullet
• Dot bullet`;
    const result = parseCodeBlocks(input);
    
    expect(result).toContain('Dash bullet');
    expect(result).toContain('Asterisk bullet');
    expect(result).toContain('Dot bullet');
  });

  test('should remove leading bullet/number markers from items', () => {
    const input = `- Item with dash
* Item with asterisk
1. Item with number
2) Item with number and parenthesis`;
    const result = parseCodeBlocks(input);
    
    expect(result).not.toMatch(/^[-•*]\s/);
    expect(result).not.toMatch(/^\d+[.)]\s/);
    expect(result).toContain('Item with dash');
    expect(result).toContain('Item with number');
  });

  test('should handle issues section with valid Proposed Fix', () => {
    const input = `- **Issue**: Something wrong
  **Proposed Fix**: This is a valid fix with enough content to pass validation
- **Issue**: Another issue
  **Proposed Fix**: Another valid fix with sufficient length`;
    const result = parseCodeBlocks(input);
    
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(result).toContain('**Proposed Fix**:');
  });

  test('should warn when issues section has empty or short Proposed Fix', () => {
    const input = `- **Issue**: Something wrong
  **Proposed Fix**: Short
- **Issue**: Another issue
  **Proposed Fix**:`;
    const result = parseCodeBlocks(input);
    
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('empty or very short Proposed Fix');
  });

  test('should skip empty lines between list items', () => {
    const input = `- First item

- Second item


- Third item`;
    const result = parseCodeBlocks(input);
    
    expect(result).toContain('First item');
    expect(result).toContain('Second item');
    expect(result).toContain('Third item');
  });

  test('should handle items with no continuation lines', () => {
    const input = `- Single line item one
- Single line item two`;
    const result = parseCodeBlocks(input);
    
    expect(result).toContain('Single line item one');
    expect(result).toContain('Single line item two');
  });

  test('should preserve the last item in the list', () => {
    const input = `- First item
- Second item
- Last item
  with continuation`;
    const result = parseCodeBlocks(input);
    
    expect(result).toContain('Last item');
    expect(result).toContain('with continuation');
  });

  test('should handle empty input', () => {
    const input = ``;
    const result = parseCodeBlocks(input);
    
    expect(result).toBeDefined();
  });

  test('should handle input with only whitespace', () => {
    const input = `   \n   \n   `;
    const result = parseCodeBlocks(input);
    
    expect(result).toBeDefined();
  });

  test('should trim whitespace from items', () => {
    const input = `-    Item with leading spaces    \n    continuation with spaces    `;
    const result = parseCodeBlocks(input);
    
    expect(result).toContain('Item with leading spaces');
    expect(result).not.toMatch(/^\s+/);
    expect(result).not.toMatch(/\s+$/);
  });

  test('should not add items with only markers and no content', () => {
    const input = `- Valid item
- \n- Another valid item`;
    const result = parseCodeBlocks(input);
    
    expect(result).toContain('Valid item');
    expect(result).toContain('Another valid item');
  });

  test('should handle complex multi-line items with special characters', () => {
    const input = `- Item with **bold** and *italic*
  More text with [link](url)
  Even more with code
- Second item`;
    const result = parseCodeBlocks(input);
    
    expect(result).toContain('**bold**');
    expect(result).toContain('*italic*');
    expect(result).toContain('[link](url)');
  });

  test('should handle Proposed Fix validation threshold of 10 characters', () => {
    const input = `- **Issue**: Test
  **Proposed Fix**: 123456789`;
    const result = parseCodeBlocks(input);
    
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    consoleWarnSpy.mockClear();
    
    const validInput = `- **Issue**: Test
  **Proposed Fix**: 1234567890`;
    const validResult = parseCodeBlocks(validInput);
    
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});