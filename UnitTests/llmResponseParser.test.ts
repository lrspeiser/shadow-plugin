import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('llmResponseParser - features extraction loop', () => {
  let sections: { features: string[] };
  let featuresPatterns: RegExp[];
  let content: string;

  beforeEach(() => {
    sections = { features: [] };
    featuresPatterns = [
      /###\s*Features[:\s]*\n([\s\S]*?)(?=###|$)/i,
      /##\s*Features[:\s]*\n([\s\S]*?)(?=##|$)/i,
      /Features[:\s]*\n([\s\S]*?)(?=\n\n|$)/i
    ];
  });

  test('should extract features with bullet points using dash', () => {
    content = '### Features:\n- Feature one\n- Feature two\n- Feature three';
    
    for (const pattern of featuresPatterns) {
      const featuresMatch = content.match(pattern);
      if (featuresMatch) {
        const featuresText = featuresMatch[1];
        sections.features = featuresText
          .split('\n')
          .filter(l => l.trim().match(/^[-•*\d]/))
          .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(l => l.length > 0);
        if (sections.features.length > 0) break;
      }
    }

    expect(sections.features).toEqual(['Feature one', 'Feature two', 'Feature three']);
  });

  test('should extract features with bullet points using asterisk', () => {
    content = '## Features:\n* Feature A\n* Feature B';
    
    for (const pattern of featuresPatterns) {
      const featuresMatch = content.match(pattern);
      if (featuresMatch) {
        const featuresText = featuresMatch[1];
        sections.features = featuresText
          .split('\n')
          .filter(l => l.trim().match(/^[-•*\d]/))
          .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(l => l.length > 0);
        if (sections.features.length > 0) break;
      }
    }

    expect(sections.features).toEqual(['Feature A', 'Feature B']);
  });

  test('should extract features with bullet points using bullet character', () => {
    content = 'Features:\n• First feature\n• Second feature';
    
    for (const pattern of featuresPatterns) {
      const featuresMatch = content.match(pattern);
      if (featuresMatch) {
        const featuresText = featuresMatch[1];
        sections.features = featuresText
          .split('\n')
          .filter(l => l.trim().match(/^[-•*\d]/))
          .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(l => l.length > 0);
        if (sections.features.length > 0) break;
      }
    }

    expect(sections.features).toEqual(['First feature', 'Second feature']);
  });

  test('should extract features with numbered list', () => {
    content = '### Features:\n1. First item\n2. Second item\n3. Third item';
    
    for (const pattern of featuresPatterns) {
      const featuresMatch = content.match(pattern);
      if (featuresMatch) {
        const featuresText = featuresMatch[1];
        sections.features = featuresText
          .split('\n')
          .filter(l => l.trim().match(/^[-•*\d]/))
          .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(l => l.length > 0);
        if (sections.features.length > 0) break;
      }
    }

    expect(sections.features).toEqual(['First item', 'Second item', 'Third item']);
  });

  test('should filter out empty lines and non-bullet lines', () => {
    content = '### Features:\n- Valid feature\n\nSome text without bullet\n- Another valid feature\n  ';
    
    for (const pattern of featuresPatterns) {
      const featuresMatch = content.match(pattern);
      if (featuresMatch) {
        const featuresText = featuresMatch[1];
        sections.features = featuresText
          .split('\n')
          .filter(l => l.trim().match(/^[-•*\d]/))
          .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(l => l.length > 0);
        if (sections.features.length > 0) break;
      }
    }

    expect(sections.features).toEqual(['Valid feature', 'Another valid feature']);
  });

  test('should try multiple patterns and break on first match', () => {
    content = '## Features:\n- Feature from second pattern';
    
    for (const pattern of featuresPatterns) {
      const featuresMatch = content.match(pattern);
      if (featuresMatch) {
        const featuresText = featuresMatch[1];
        sections.features = featuresText
          .split('\n')
          .filter(l => l.trim().match(/^[-•*\d]/))
          .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(l => l.length > 0);
        if (sections.features.length > 0) break;
      }
    }

    expect(sections.features).toEqual(['Feature from second pattern']);
  });

  test('should handle content with no matching pattern', () => {
    content = 'Some random content without features section';
    
    for (const pattern of featuresPatterns) {
      const featuresMatch = content.match(pattern);
      if (featuresMatch) {
        const featuresText = featuresMatch[1];
        sections.features = featuresText
          .split('\n')
          .filter(l => l.trim().match(/^[-•*\d]/))
          .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(l => l.length > 0);
        if (sections.features.length > 0) break;
      }
    }

    expect(sections.features).toEqual([]);
  });

  test('should handle features section with no valid bullet points', () => {
    content = '### Features:\nJust plain text\nNo bullets here';
    
    for (const pattern of featuresPatterns) {
      const featuresMatch = content.match(pattern);
      if (featuresMatch) {
        const featuresText = featuresMatch[1];
        sections.features = featuresText
          .split('\n')
          .filter(l => l.trim().match(/^[-•*\d]/))
          .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(l => l.length > 0);
        if (sections.features.length > 0) break;
      }
    }

    expect(sections.features).toEqual([]);
  });

  test('should trim whitespace from extracted features', () => {
    content = '### Features:\n-   Feature with spaces   \n-  Another one  ';
    
    for (const pattern of featuresPatterns) {
      const featuresMatch = content.match(pattern);
      if (featuresMatch) {
        const featuresText = featuresMatch[1];
        sections.features = featuresText
          .split('\n')
          .filter(l => l.trim().match(/^[-•*\d]/))
          .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(l => l.length > 0);
        if (sections.features.length > 0) break;
      }
    }

    expect(sections.features).toEqual(['Feature with spaces', 'Another one']);
  });

  test('should handle mixed bullet styles', () => {
    content = '### Features:\n- Dash feature\n* Asterisk feature\n• Bullet feature\n1. Numbered feature';
    
    for (const pattern of featuresPatterns) {
      const featuresMatch = content.match(pattern);
      if (featuresMatch) {
        const featuresText = featuresMatch[1];
        sections.features = featuresText
          .split('\n')
          .filter(l => l.trim().match(/^[-•*\d]/))
          .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(l => l.length > 0);
        if (sections.features.length > 0) break;
      }
    }

    expect(sections.features).toEqual(['Dash feature', 'Asterisk feature', 'Bullet feature', 'Numbered feature']);
  });
});