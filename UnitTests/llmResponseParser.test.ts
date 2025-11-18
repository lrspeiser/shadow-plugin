import { LLMResponseParser } from '../ai/llmResponseParser';

// Test: test_parseResponse_validatesAgainstSchema
// Verifies parser validates responses against provided JSON schemas
import { LLMResponseParser } from '../ai/llmResponseParser';

describe('LLMResponseParser.parseResponse', () => {
  let parser: LLMResponseParser;

  beforeEach(() => {
    parser = new LLMResponseParser();
  });

  test('validates response against schema successfully', () => {
    const schema = {
      type: 'object',
      properties: {
        result: { type: 'string' },
        count: { type: 'number' }
      },
      required: ['result']
    };
    const response = { result: 'success', count: 42 };

    const parsed = parser.parseResponse(JSON.stringify(response), schema);

    expect(parsed.result).toBe('success');
    expect(parsed.count).toBe(42);
  });

  test('rejects response with missing required fields', () => {
    const schema = {
      type: 'object',
      properties: {
        required_field: { type: 'string' }
      },
      required: ['required_field']
    };
    const response = { optional_field: 'value' };

    expect(() => parser.parseResponse(JSON.stringify(response), schema)).toThrow();
  });

  test('rejects response with wrong types', () => {
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'number' }
      },
      required: ['count']
    };
    const response = { count: 'not a number' };

    expect(() => parser.parseResponse(JSON.stringify(response), schema)).toThrow();
  });

  test('handles nested object validation', () => {
    const schema = {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            nested: { type: 'string' }
          },
          required: ['nested']
        }
      },
      required: ['data']
    };
    const response = { data: { nested: 'value' } };

    const parsed = parser.parseResponse(JSON.stringify(response), schema);

    expect(parsed.data.nested).toBe('value');
  });
});
