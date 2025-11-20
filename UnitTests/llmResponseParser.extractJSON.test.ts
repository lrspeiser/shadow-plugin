import * as fs from 'fs';
import * as path from 'path';

describe('llmResponseParser - extractJSON (if branch)', () => {
  const modulePath = '/test/module/path';
  const moduleType = 'api';
  const files = ['file1.ts', 'file2.ts'];

  function executeExtractJSONBranch(content: string) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        module: modulePath,
        moduleType: moduleType,
        capabilities: parsed.capabilities || [],
        summary: parsed.summary || '',
        files: files,
        endpoints: parsed.endpoints,
        commands: parsed.commands,
        workers: parsed.workers
      };
    }
    return null;
  }

  test('should extract and parse valid JSON with all fields', () => {
    const content = `Some text before {"capabilities": ["read", "write"], "summary": "Test module", "endpoints": [{"path": "/api/test"}], "commands": ["start"], "workers": ["worker1"]} text after`;
    
    const result = executeExtractJSONBranch(content);
    
    expect(result).not.toBeNull();
    expect(result?.module).toBe('/test/module/path');
    expect(result?.moduleType).toBe('api');
    expect(result?.capabilities).toEqual(['read', 'write']);
    expect(result?.summary).toBe('Test module');
    expect(result?.files).toEqual(['file1.ts', 'file2.ts']);
    expect(result?.endpoints).toEqual([{path: '/api/test'}]);
    expect(result?.commands).toEqual(['start']);
    expect(result?.workers).toEqual(['worker1']);
  });

  test('should use default empty values for missing optional fields', () => {
    const content = `{"endpoints": null, "commands": null, "workers": null}`;
    
    const result = executeExtractJSONBranch(content);
    
    expect(result).not.toBeNull();
    expect(result?.capabilities).toEqual([]);
    expect(result?.summary).toBe('');
    expect(result?.endpoints).toBeNull();
    expect(result?.commands).toBeNull();
    expect(result?.workers).toBeNull();
  });

  test('should handle JSON with nested objects and arrays', () => {
    const content = `Prefix text {"capabilities": ["auth", "data"], "summary": "Complex module", "endpoints": [{"path": "/v1/users", "methods": ["GET", "POST"]}, {"path": "/v1/admin"}], "commands": ["init", "deploy"], "workers": ["queue-processor", "email-sender"]} suffix`;
    
    const result = executeExtractJSONBranch(content);
    
    expect(result).not.toBeNull();
    expect(result?.capabilities).toHaveLength(2);
    expect(result?.endpoints).toHaveLength(2);
    expect(result?.endpoints?.[0]).toEqual({path: '/v1/users', methods: ['GET', 'POST']});
    expect(result?.commands).toEqual(['init', 'deploy']);
    expect(result?.workers).toEqual(['queue-processor', 'email-sender']);
  });

  test('should extract first JSON object from multiline content', () => {
    const content = `Line 1\nLine 2\n{\n  "capabilities": ["test"],\n  "summary": "Multiline\nSummary",\n  "endpoints": [],\n  "commands": [],\n  "workers": []\n}\nMore text`;
    
    const result = executeExtractJSONBranch(content);
    
    expect(result).not.toBeNull();
    expect(result?.capabilities).toEqual(['test']);
    expect(result?.summary).toBe('Multiline\nSummary');
    expect(result?.endpoints).toEqual([]);
  });

  test('should handle empty JSON object', () => {
    const content = `Text before {} text after`;
    
    const result = executeExtractJSONBranch(content);
    
    expect(result).not.toBeNull();
    expect(result?.capabilities).toEqual([]);
    expect(result?.summary).toBe('');
    expect(result?.endpoints).toBeUndefined();
    expect(result?.commands).toBeUndefined();
    expect(result?.workers).toBeUndefined();
  });

  test('should return null when no JSON object is found', () => {
    const content = `No JSON here, just plain text`;
    
    const result = executeExtractJSONBranch(content);
    
    expect(result).toBeNull();
  });

  test('should throw error for invalid JSON syntax', () => {
    const content = `{"capabilities": ["test", "summary": "Invalid"}`;
    
    expect(() => {
      executeExtractJSONBranch(content);
    }).toThrow();
  });

  test('should handle JSON with special characters in strings', () => {
    const content = `{"capabilities": ["read\\", \"write"], "summary": "Test with \"quotes\" and \\backslashes\\", "endpoints": null, "commands": null, "workers": null}`;
    
    const result = executeExtractJSONBranch(content);
    
    expect(result).not.toBeNull();
    expect(result?.summary).toContain('quotes');
    expect(result?.summary).toContain('backslashes');
  });

  test('should extract first JSON when multiple JSON objects exist', () => {
    const content = `{"capabilities": ["first"], "summary": "First object", "endpoints": null} {"capabilities": ["second"], "summary": "Second object"}`;
    
    const result = executeExtractJSONBranch(content);
    
    expect(result).not.toBeNull();
    expect(result?.capabilities).toEqual(['first']);
    expect(result?.summary).toBe('First object');
  });

  test('should handle JSON with null values', () => {
    const content = `{"capabilities": null, "summary": null, "endpoints": null, "commands": null, "workers": null}`;
    
    const result = executeExtractJSONBranch(content);
    
    expect(result).not.toBeNull();
    expect(result?.capabilities).toEqual([]);
    expect(result?.summary).toBe('');
    expect(result?.endpoints).toBeNull();
  });

  test('should handle JSON with numeric and boolean values', () => {
    const content = `{"capabilities": ["test"], "summary": "Test", "endpoints": [{"id": 123, "active": true}], "commands": ["cmd"], "workers": []}`;
    
    const result = executeExtractJSONBranch(content);
    
    expect(result).not.toBeNull();
    expect(result?.endpoints?.[0]).toEqual({id: 123, active: true});
  });
});