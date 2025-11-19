import { LLMResponseParser } from '../ai/llmResponseParser';

// Test: test_parse_valid_json_response
// Verifies parser extracts valid JSON from LLM response with various formats
describe('LLMResponseParser - parseResponse', () => {
  let parser: LLMResponseParser;

  beforeEach(() => {
    parser = new LLMResponseParser();
  });

  test('should parse plain JSON response', () => {
    const response = '{"key": "value", "number": 42}';

    const result = parser.parseResponse(response);

    expect(result).toEqual({ key: 'value', number: 42 });
  });

  test('should extract JSON from markdown code blocks', () => {
    const response = '\n{"key": "value"}\n';

    const result = parser.parseResponse(response);

    expect(result).toEqual({ key: 'value' });
  });

  test('should handle JSON with leading text', () => {
    const response = 'Here is the result:\n{"key": "value"}';

    const result = parser.parseResponse(response);

    expect(result).toEqual({ key: 'value' });
  });

  test('should parse nested JSON structures', () => {
    const response = '{"outer": {"inner": "value", "array": [1, 2, 3]}}';

    const result = parser.parseResponse(response);

    expect(result).toEqual({
      outer: {
        inner: 'value',
        array: [1, 2, 3]
      }
    });
  });

  test('should throw error for invalid JSON', () => {
    const response = 'not valid json at all';

    expect(() => parser.parseResponse(response)).toThrow();
  });

  test('should handle empty response', () => {
    const response = '';

    expect(() => parser.parseResponse(response)).toThrow();
  });
});

// Test: test_validate_schema_compliance
// Verifies response validation against expected schema definitions
describe('LLMResponseParser - validateSchema', () => {
  let parser: LLMResponseParser;

  beforeEach(() => {
    parser = new LLMResponseParser();
  });

  test('should validate response matching schema', () => {
    const schema = {
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    };

    const data = { name: 'John', age: 30 };

    expect(() => parser.validateSchema(data, schema)).not.toThrow();
  });

  test('should reject response with missing required fields', () => {
    const schema = {
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    };

    const data = { name: 'John' };

    expect(() => parser.validateSchema(data, schema)).toThrow('Missing required field: age');
  });

  test('should detect type mismatches', () => {
    const schema = {
      type: 'object',
      properties: {
        age: { type: 'number' }
      }
    };

    const data = { age: 'thirty' };

    expect(() => parser.validateSchema(data, schema)).toThrow('Type mismatch');
  });

  test('should allow extra fields when additionalProperties true', () => {
    const schema = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' }
      },
      additionalProperties: true
    };

    const data = { name: 'John', extra: 'field' };

    expect(() => parser.validateSchema(data, schema)).not.toThrow();
  });
});
