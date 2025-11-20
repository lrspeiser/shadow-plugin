import * as fs from 'fs';
import * as path from 'path';

describe('parseCodeBlocks nested (if) - List Item Processing', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  function simulateListItemProcessing(
    isListItemStart: boolean,
    isIssuesSection: boolean,
    currentItem: string[],
    items: string[],
    trimmed: string
  ): { currentItem: string[], items: string[] } {
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
    return { currentItem, items };
  }

  test('should save previous item and start new item when isListItemStart is true', () => {
    const currentItem = ['- Previous item', 'continuation line'];
    const items: string[] = [];
    const trimmed = '- New item';
    const isListItemStart = true;
    const isIssuesSection = false;

    const result = simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toBe('Previous item\ncontinuation line');
    expect(result.currentItem).toEqual([trimmed]);
  });

  test('should remove leading bullet markers from saved items', () => {
    const testCases = [
      { input: ['- Bullet item'], expected: 'Bullet item' },
      { input: ['• Unicode bullet'], expected: 'Unicode bullet' },
      { input: ['* Asterisk bullet'], expected: 'Asterisk bullet' },
      { input: ['1. Numbered item'], expected: 'Numbered item' },
      { input: ['42) Parenthesis numbered'], expected: 'Parenthesis numbered' }
    ];

    testCases.forEach(({ input, expected }) => {
      const items: string[] = [];
      const result = simulateListItemProcessing(
        true,
        false,
        input,
        items,
        '- Next item'
      );
      expect(result.items[0]).toBe(expected);
    });
  });

  test('should warn when Proposed Fix is empty or too short in issues section', () => {
    const currentItem = [
      '- Issue: Something wrong',
      '**Proposed Fix**: '
    ];
    const items: string[] = [];
    const trimmed = '- Next issue';
    const isListItemStart = true;
    const isIssuesSection = true;

    simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Issue found with empty or very short Proposed Fix');
  });

  test('should warn when Proposed Fix has less than 10 characters in issues section', () => {
    const currentItem = [
      '- Issue: Something wrong',
      '**Proposed Fix**: short'
    ];
    const items: string[] = [];
    const trimmed = '- Next issue';
    const isListItemStart = true;
    const isIssuesSection = true;

    simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Issue found with empty or very short Proposed Fix');
  });

  test('should not warn when Proposed Fix has adequate content in issues section', () => {
    const currentItem = [
      '- Issue: Something wrong',
      '**Proposed Fix**: This is a proper fix with sufficient detail'
    ];
    const items: string[] = [];
    const trimmed = '- Next issue';
    const isListItemStart = true;
    const isIssuesSection = true;

    simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(items).toHaveLength(1);
  });

  test('should not warn about Proposed Fix in non-issues sections', () => {
    const currentItem = [
      '- Item with **Proposed Fix**: short'
    ];
    const items: string[] = [];
    const trimmed = '- Next item';
    const isListItemStart = true;
    const isIssuesSection = false;

    simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  test('should append continuation lines to current item when not a list start', () => {
    const currentItem = ['- First line'];
    const items: string[] = [];
    const trimmed = 'continuation line';
    const isListItemStart = false;
    const isIssuesSection = false;

    const result = simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(result.currentItem).toEqual(['- First line', 'continuation line']);
    expect(result.items).toHaveLength(0);
  });

  test('should not append empty lines to current item', () => {
    const currentItem = ['- First line'];
    const items: string[] = [];
    const trimmed = '';
    const isListItemStart = false;
    const isIssuesSection = false;

    const result = simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(result.currentItem).toEqual(['- First line']);
    expect(result.items).toHaveLength(0);
  });

  test('should not append to empty current item', () => {
    const currentItem: string[] = [];
    const items: string[] = [];
    const trimmed = 'orphan line';
    const isListItemStart = false;
    const isIssuesSection = false;

    const result = simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(result.currentItem).toEqual([]);
    expect(result.items).toHaveLength(0);
  });

  test('should not add empty items to items array', () => {
    const currentItem = ['   '];
    const items: string[] = [];
    const trimmed = '- New item';
    const isListItemStart = true;
    const isIssuesSection = false;

    const result = simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(result.items).toHaveLength(0);
  });

  test('should handle multiline items with Proposed Fix validation', () => {
    const currentItem = [
      '- **Issue**: Memory leak detected',
      '**Location**: line 45',
      '**Proposed Fix**: Implement proper cleanup in dispose method with resource tracking'
    ];
    const items: string[] = [];
    const trimmed = '- Next issue';
    const isListItemStart = true;
    const isIssuesSection = true;

    const result = simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toContain('**Proposed Fix**');
  });

  test('should truncate warning message to 200 characters', () => {
    const longItem = '- Issue: ' + 'a'.repeat(300) + ' **Proposed Fix**: ';
    const currentItem = [longItem];
    const items: string[] = [];
    const trimmed = '- Next issue';
    const isListItemStart = true;
    const isIssuesSection = true;

    simulateListItemProcessing(
      isListItemStart,
      isIssuesSection,
      currentItem,
      items,
      trimmed
    );

    expect(consoleSpy).toHaveBeenCalled();
    const warningMessage = consoleSpy.mock.calls[0][0];
    const substringPart = warningMessage.match(/: (.+)$/)[1];
    expect(substringPart.length).toBeLessThanOrEqual(200);
  });
});