import * as fs from 'fs';
import * as path from 'path';

describe('sanitizeResponse - line parsing loop', () => {
  interface ParsedItem {
    title: string;
    description: string;
    relevantFiles?: string[];
    relevantFunctions?: string[];
  }

  function parseLines(input: string): ParsedItem[] {
    const lines = input.split('\n');
    const items: ParsedItem[] = [];
    let currentItem: ParsedItem | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.match(/^[-•*]\s+(.+?):\s*(.+)$/)) {
        const match = trimmed.match(/^[-•*]\s+(.+?):\s*(.+)$/);
        if (match) {
          if (currentItem) {
            items.push(currentItem);
          }
          currentItem = {
            title: match[1].trim(),
            description: match[2].trim()
          };
        }
      } else if (trimmed.match(/^\*\*Title\*\*:\s*(.+)$/i)) {
        const match = trimmed.match(/^\*\*Title\*\*:\s*(.+)$/i);
        if (match) {
          if (currentItem) {
            items.push(currentItem);
          }
          currentItem = {
            title: match[1].trim(),
            description: ''
          };
        }
      } else if (trimmed.match(/^\*\*Description\*\*:\s*(.+)$/i)) {
        const match = trimmed.match(/^\*\*Description\*\*:\s*(.+)$/i);
        if (match && currentItem) {
          currentItem.description = match[1].trim();
        }
      } else if (trimmed.match(/^\*\*Files\*\*:\s*(.+)$/i)) {
        const match = trimmed.match(/^\*\*Files\*\*:\s*(.+)$/i);
        if (match && currentItem) {
          currentItem.relevantFiles = match[1].split(',').map(f => f.trim());
        }
      } else if (trimmed.match(/^\*\*Functions\*\*:\s*(.+)$/i)) {
        const match = trimmed.match(/^\*\*Functions\*\*:\s*(.+)$/i);
        if (match && currentItem) {
          currentItem.relevantFunctions = match[1].split(',').map(f => f.trim());
        }
      } else if (trimmed.length > 0 && currentItem) {
        if (currentItem.description) {
          currentItem.description += '\n' + trimmed;
        } else {
          currentItem.description = trimmed;
        }
      }
    }

    if (currentItem) {
      items.push(currentItem);
    }

    return items;
  }

  test('should parse simple bullet point format with title and description', () => {
    const input = '- Feature A: This is a description\n- Feature B: Another description';
    const result = parseLines(input);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      title: 'Feature A',
      description: 'This is a description'
    });
    expect(result[1]).toEqual({
      title: 'Feature B',
      description: 'Another description'
    });
  });

  test('should parse markdown bold format with Title and Description', () => {
    const input = '**Title**: Authentication System\n**Description**: Handles user login and logout';
    const result = parseLines(input);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      title: 'Authentication System',
      description: 'Handles user login and logout'
    });
  });

  test('should handle multiline descriptions', () => {
    const input = '- Task One: First line\nSecond line\nThird line\n- Task Two: Another task';
    const result = parseLines(input);
    
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Task One');
    expect(result[0].description).toBe('First line\nSecond line\nThird line');
    expect(result[1].title).toBe('Task Two');
    expect(result[1].description).toBe('Another task');
  });

  test('should parse Files and Functions fields', () => {
    const input = '**Title**: Module Test\n**Description**: Test module\n**Files**: file1.ts, file2.ts, file3.ts\n**Functions**: funcA, funcB, funcC';
    const result = parseLines(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Module Test');
    expect(result[0].description).toBe('Test module');
    expect(result[0].relevantFiles).toEqual(['file1.ts', 'file2.ts', 'file3.ts']);
    expect(result[0].relevantFunctions).toEqual(['funcA', 'funcB', 'funcC']);
  });

  test('should handle different bullet characters (-, •, *)', () => {
    const input = '- Item One: Description one\n• Item Two: Description two\n* Item Three: Description three';
    const result = parseLines(input);
    
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Item One');
    expect(result[1].title).toBe('Item Two');
    expect(result[2].title).toBe('Item Three');
  });

  test('should handle empty lines and whitespace', () => {
    const input = '\n  \n- Task: Description\n\n  \n';
    const result = parseLines(input);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      title: 'Task',
      description: 'Description'
    });
  });

  test('should handle case-insensitive Title and Description markers', () => {
    const input = '**title**: Lower Case\n**DESCRIPTION**: Upper Case';
    const result = parseLines(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Lower Case');
    expect(result[0].description).toBe('Upper Case');
  });

  test('should not add description if no current item exists', () => {
    const input = 'Random text without item\n**Description**: This should be ignored';
    const result = parseLines(input);
    
    expect(result).toHaveLength(0);
  });

  test('should handle Files and Functions only when current item exists', () => {
    const input = '**Files**: orphaned.ts\n**Title**: Valid Item\n**Functions**: validFunc';
    const result = parseLines(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].relevantFiles).toBeUndefined();
    expect(result[0].relevantFunctions).toEqual(['validFunc']);
  });

  test('should handle complex mixed format document', () => {
    const input = `**Title**: Feature Alpha
**Description**: Main description
Continued description line
**Files**: alpha.ts, beta.ts
**Functions**: init, process

- Feature Beta: Quick format description
More details here

**Title**: Feature Gamma
**Description**: Another feature
**Files**: gamma.ts`;
    
    const result = parseLines(input);
    
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Feature Alpha');
    expect(result[0].description).toBe('Main description\nContinued description line');
    expect(result[0].relevantFiles).toEqual(['alpha.ts', 'beta.ts']);
    expect(result[0].relevantFunctions).toEqual(['init', 'process']);
    
    expect(result[1].title).toBe('Feature Beta');
    expect(result[1].description).toBe('Quick format description\nMore details here');
    
    expect(result[2].title).toBe('Feature Gamma');
    expect(result[2].description).toBe('Another feature');
    expect(result[2].relevantFiles).toEqual(['gamma.ts']);
  });

  test('should handle empty description with continuation lines', () => {
    const input = '**Title**: Empty Start\nFirst continuation\nSecond continuation';
    const result = parseLines(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('First continuation\nSecond continuation');
  });

  test('should trim whitespace from titles, descriptions, files, and functions', () => {
    const input = '**Title**:   Spaces Everywhere   \n**Description**:   Lots of spaces   \n**Files**:   file1.ts  ,  file2.ts  \n**Functions**:   func1  ,  func2  ';
    const result = parseLines(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Spaces Everywhere');
    expect(result[0].description).toBe('Lots of spaces');
    expect(result[0].relevantFiles).toEqual(['file1.ts', 'file2.ts']);
    expect(result[0].relevantFunctions).toEqual(['func1', 'func2']);
  });

  test('should handle edge case with colon in description', () => {
    const input = '- Title: Description with: multiple: colons';
    const result = parseLines(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Title');
    expect(result[0].description).toBe('Description with: multiple: colons');
  });
});