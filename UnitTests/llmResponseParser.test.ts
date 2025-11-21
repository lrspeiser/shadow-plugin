import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('llmResponseParser - list item parsing loop', () => {
  let consoleWarnSpy: jest.SpyInstance;
  
  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });
  
  const executeLoop = (lines: string[], isIssuesSection: boolean = false): string[] => {
    const items: string[] = [];
    let currentItem: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      const isListItemStart = trimmed.match(/^[-•*]\s+/) || 
                              trimmed.match(/^\d+[.)]\s+/) || 
                              trimmed.match(/^[-•*]\s/) ||
                              trimmed.match(/^[•]\s/);
      
      if (isListItemStart) {
        if (currentItem.length > 0) {
          let fullItem = currentItem.join('\n').trim();
          fullItem = fullItem.replace(/^[-•*\d.)]\s+/, '').trim();
          
          if (isIssuesSection && fullItem.includes('**Proposed Fix**:')) {
            const fixMatch = fullItem.match(/\*\*Proposed Fix\*\*:\s*(.+)/s);
            if (!fixMatch || !fixMatch[1] || fixMatch[1].trim().length < 10) {
              console.warn(`Issue found with empty or very short Proposed Fix: ${fullItem.substring(0, 200)}`);
            }
          }
          
          if (fullItem.length > 0) {
            items.push(fullItem);
          }
        }
        currentItem = [trimmed];
      } else if (trimmed.length > 0 && currentItem.length > 0) {
        currentItem.push(trimmed);
      }
    }
    
    return items;
  };
  
  describe('Happy Path - Basic List Parsing', () => {
    test('should parse simple dash-prefixed list items', () => {
      const lines = [
        '- First item',
        '- Second item',
        '- Third item'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual(['First item', 'Second item', 'Third item']);
    });
    
    test('should parse bullet-prefixed list items', () => {
      const lines = [
        '• First bullet',
        '• Second bullet',
        '• Third bullet'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual(['First bullet', 'Second bullet', 'Third bullet']);
    });
    
    test('should parse numbered list items with dot', () => {
      const lines = [
        '1. First item',
        '2. Second item',
        '3. Third item'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual(['First item', 'Second item', 'Third item']);
    });
    
    test('should parse numbered list items with parenthesis', () => {
      const lines = [
        '1) First item',
        '2) Second item',
        '3) Third item'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual(['First item', 'Second item', 'Third item']);
    });
    
    test('should parse asterisk-prefixed list items', () => {
      const lines = [
        '* First star',
        '* Second star',
        '* Third star'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual(['First star', 'Second star', 'Third star']);
    });
  });
  
  describe('Multi-line List Items', () => {
    test('should handle list items spanning multiple lines', () => {
      const lines = [
        '- First item',
        'continuation of first',
        'more continuation',
        '- Second item',
        'continuation of second'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual([
        'First item\ncontinuation of first\nmore continuation',
        'Second item\ncontinuation of second'
      ]);
    });
    
    test('should handle empty lines between continuations gracefully', () => {
      const lines = [
        '- First item',
        'continuation',
        '',
        '- Second item'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual([
        'First item\ncontinuation',
        'Second item'
      ]);
    });
    
    test('should accumulate all non-empty trimmed lines as continuations', () => {
      const lines = [
        '- Item one',
        '  indented continuation',
        'regular continuation',
        '- Item two'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual([
        'Item one\nindented continuation\nregular continuation',
        'Item two'
      ]);
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle empty lines array', () => {
      const lines: string[] = [];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual([]);
    });
    
    test('should handle array with only empty strings', () => {
      const lines = ['', '', ''];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual([]);
    });
    
    test('should handle array with only whitespace', () => {
      const lines = ['   ', '\t', '  \n  '];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual([]);
    });
    
    test('should not create item from non-list content before first list marker', () => {
      const lines = [
        'Random text without marker',
        'More random text',
        '- First actual item'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual(['First actual item']);
    });
    
    test('should handle mixed list marker types', () => {
      const lines = [
        '- Dash item',
        '• Bullet item',
        '1. Numbered item',
        '* Asterisk item'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual([
        'Dash item',
        'Bullet item',
        'Numbered item',
        'Asterisk item'
      ]);
    });
    
    test('should strip leading markers correctly', () => {
      const lines = [
        '- Item with dash',
        '• Item with bullet',
        '123. Item with number',
        '* Item with star'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual([
        'Item with dash',
        'Item with bullet',
        'Item with number',
        'Item with star'
      ]);
    });
    
    test('should handle list items with only markers', () => {
      const lines = [
        '- ',
        '• ',
        '1. '
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual([]);
    });
  });
  
  describe('Issues Section with Proposed Fix Validation', () => {
    test('should not warn for valid Proposed Fix with sufficient content', () => {
      const lines = [
        '- **Issue**: Some problem',
        '**Proposed Fix**: This is a detailed fix with more than ten characters'
      ];
      
      const result = executeLoop(lines, true);
      
      expect(result).toHaveLength(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
    
    test('should warn for Proposed Fix with very short content', () => {
      const lines = [
        '- **Issue**: Some problem',
        '**Proposed Fix**: short'
      ];
      
      const result = executeLoop(lines, true);
      
      expect(result).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Issue found with empty or very short Proposed Fix')
      );
    });
    
    test('should warn for Proposed Fix with empty content', () => {
      const lines = [
        '- **Issue**: Some problem',
        '**Proposed Fix**: '
      ];
      
      const result = executeLoop(lines, true);
      
      expect(result).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Issue found with empty or very short Proposed Fix')
      );
    });
    
    test('should warn for Proposed Fix with only whitespace', () => {
      const lines = [
        '- **Issue**: Some problem',
        '**Proposed Fix**:    '
      ];
      
      const result = executeLoop(lines, true);
      
      expect(result).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Issue found with empty or very short Proposed Fix')
      );
    });
    
    test('should not warn when isIssuesSection is false', () => {
      const lines = [
        '- **Issue**: Some problem',
        '**Proposed Fix**: short'
      ];
      
      const result = executeLoop(lines, false);
      
      expect(result).toHaveLength(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
    
    test('should warn and truncate long items in warning message', () => {
      const longContent = 'x'.repeat(250);
      const lines = [
        `- **Issue**: ${longContent}`,
        '**Proposed Fix**: bad'
      ];
      
      const result = executeLoop(lines, true);
      
      expect(result).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^Issue found with empty or very short Proposed Fix: .{1,200}$/)
      );
    });
    
    test('should handle multiple issues with mixed valid and invalid fixes', () => {
      const lines = [
        '- **Issue**: First problem',
        '**Proposed Fix**: This is a good fix with enough content',
        '- **Issue**: Second problem',
        '**Proposed Fix**: bad',
        '- **Issue**: Third problem',
        '**Proposed Fix**: Another good fix with sufficient detail'
      ];
      
      const result = executeLoop(lines, true);
      
      expect(result).toHaveLength(3);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Complex Scenarios', () => {
    test('should handle real-world formatted issue items', () => {
      const lines = [
        '- **Issue**: Variable naming inconsistency',
        '  **Location**: src/utils/helper.ts:45',
        '  **Severity**: Low',
        '  **Proposed Fix**: Rename variable to follow camelCase convention',
        '- **Issue**: Missing error handling',
        '  **Location**: src/api/client.ts:120',
        '  **Severity**: High',
        '  **Proposed Fix**: Add try-catch block around async operation'
      ];
      
      const result = executeLoop(lines, true);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toContain('Variable naming inconsistency');
      expect(result[1]).toContain('Missing error handling');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
    
    test('should handle items without Proposed Fix in issues section', () => {
      const lines = [
        '- **Issue**: Some problem without fix',
        '  **Location**: src/test.ts:10'
      ];
      
      const result = executeLoop(lines, true);
      
      expect(result).toHaveLength(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
    
    test('should handle single item that spans entire array', () => {
      const lines = [
        '- First line of item',
        'Second line',
        'Third line',
        'Fourth line'
      ];
      
      const result = executeLoop(lines);
      
      expect(result).toEqual([]);
    });
  });
});