import { parseAnalysisResponse } from '../responseParser';
import * as jsonParser from '../jsonParser';
import * as naturalLanguageExtractor from '../naturalLanguageExtractor';

// Mocks
jest.mock('../jsonParser');
jest.mock('../naturalLanguageExtractor');

describe('parseAnalysisResponse', () => {
  let mockJsonParse: jest.SpyInstance;
  let mockExtractData: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonParse = jest.spyOn(jsonParser, 'parse');
    mockExtractData = jest.spyOn(naturalLanguageExtractor, 'extract');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Happy Path', () => {
    test('should parse valid JSON response successfully', () => {
      const validResponse = '{"analysis": {"issues": [], "suggestions": []}}';
      const expectedParsed = { analysis: { issues: [], suggestions: [] } };
      
      mockJsonParse.mockReturnValue(expectedParsed);
      
      const result = parseAnalysisResponse(validResponse);
      
      expect(mockJsonParse).toHaveBeenCalledWith(validResponse);
      expect(result).toEqual(expectedParsed);
    });

    test('should parse complex analysis response with multiple issues', () => {
      const complexResponse = '{"analysis": {"issues": [{"severity": "high", "message": "Bug found"}], "suggestions": [{"type": "refactor"}]}}';
      const expectedParsed = {
        analysis: {
          issues: [{ severity: 'high', message: 'Bug found' }],
          suggestions: [{ type: 'refactor' }]
        }
      };
      
      mockJsonParse.mockReturnValue(expectedParsed);
      
      const result = parseAnalysisResponse(complexResponse);
      
      expect(result).toEqual(expectedParsed);
      expect(result.analysis.issues).toHaveLength(1);
      expect(result.analysis.suggestions).toHaveLength(1);
    });

    test('should handle natural language response and extract data', () => {
      const naturalLanguageResponse = 'The code has several issues. First, there is a memory leak. Second, the function is too complex.';
      const extractedData = {
        analysis: {
          issues: [
            { message: 'Memory leak detected' },
            { message: 'Function complexity too high' }
          ],
          suggestions: []
        }
      };
      
      mockJsonParse.mockReturnValue(null);
      mockExtractData.mockReturnValue(extractedData);
      
      const result = parseAnalysisResponse(naturalLanguageResponse);
      
      expect(mockJsonParse).toHaveBeenCalledWith(naturalLanguageResponse);
      expect(mockExtractData).toHaveBeenCalledWith(naturalLanguageResponse);
      expect(result).toEqual(extractedData);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string input', () => {
      mockJsonParse.mockReturnValue(null);
      mockExtractData.mockReturnValue({ analysis: { issues: [], suggestions: [] } });
      
      const result = parseAnalysisResponse('');
      
      expect(mockExtractData).toHaveBeenCalledWith('');
      expect(result).toEqual({ analysis: { issues: [], suggestions: [] } });
    });

    test('should handle whitespace-only input', () => {
      const whitespaceInput = '   \n\t  ';
      mockJsonParse.mockReturnValue(null);
      mockExtractData.mockReturnValue({ analysis: { issues: [], suggestions: [] } });
      
      const result = parseAnalysisResponse(whitespaceInput);
      
      expect(mockExtractData).toHaveBeenCalled();
      expect(result.analysis).toBeDefined();
    });

    test('should handle response with escaped characters', () => {
      const escapedResponse = '{"analysis": {"message": "Line break\\nand tab\\t"}}';
      const expectedParsed = { analysis: { message: 'Line break\nand tab\t' } };
      
      mockJsonParse.mockReturnValue(expectedParsed);
      
      const result = parseAnalysisResponse(escapedResponse);
      
      expect(result).toEqual(expectedParsed);
    });

    test('should handle response with unicode characters', () => {
      const unicodeResponse = '{"analysis": {"message": "测试 🚀 Émoji"}}';
      const expectedParsed = { analysis: { message: '测试 🚀 Émoji' } };
      
      mockJsonParse.mockReturnValue(expectedParsed);
      
      const result = parseAnalysisResponse(unicodeResponse);
      
      expect(result).toEqual(expectedParsed);
    });

    test('should handle very large response', () => {
      const largeIssues = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        message: `Issue ${i}`
      }));
      const largeResponse = JSON.stringify({ analysis: { issues: largeIssues } });
      const expectedParsed = { analysis: { issues: largeIssues } };
      
      mockJsonParse.mockReturnValue(expectedParsed);
      
      const result = parseAnalysisResponse(largeResponse);
      
      expect(result.analysis.issues).toHaveLength(1000);
    });

    test('should handle response with null values', () => {
      const responseWithNull = '{"analysis": {"issues": null, "suggestions": null}}';
      const expectedParsed = { analysis: { issues: null, suggestions: null } };
      
      mockJsonParse.mockReturnValue(expectedParsed);
      
      const result = parseAnalysisResponse(responseWithNull);
      
      expect(result).toEqual(expectedParsed);
    });

    test('should handle mixed JSON and natural language response', () => {
      const mixedResponse = 'Here are the results: {"analysis": {"issues": []}} with some extra text';
      const extractedData = { analysis: { issues: [] } };
      
      mockJsonParse.mockReturnValue(null);
      mockExtractData.mockReturnValue(extractedData);
      
      const result = parseAnalysisResponse(mixedResponse);
      
      expect(mockExtractData).toHaveBeenCalledWith(mixedResponse);
      expect(result).toEqual(extractedData);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', () => {
      const malformedJson = '{"analysis": {"issues": [}';
      const fallbackData = { analysis: { issues: [], suggestions: [] } };
      
      mockJsonParse.mockReturnValue(null);
      mockExtractData.mockReturnValue(fallbackData);
      
      const result = parseAnalysisResponse(malformedJson);
      
      expect(mockExtractData).toHaveBeenCalledWith(malformedJson);
      expect(result).toEqual(fallbackData);
    });

    test('should handle jsonParser throwing error', () => {
      const validJson = '{"analysis": {}}';
      const fallbackData = { analysis: { issues: [], suggestions: [] } };
      
      mockJsonParse.mockImplementation(() => {
        throw new Error('JSON parsing error');
      });
      mockExtractData.mockReturnValue(fallbackData);
      
      const result = parseAnalysisResponse(validJson);
      
      expect(mockExtractData).toHaveBeenCalled();
      expect(result).toEqual(fallbackData);
    });

    test('should handle naturalLanguageExtractor throwing error', () => {
      const response = 'Some natural language response';
      
      mockJsonParse.mockReturnValue(null);
      mockExtractData.mockImplementation(() => {
        throw new Error('Extraction error');
      });
      
      expect(() => parseAnalysisResponse(response)).toThrow('Extraction error');
    });

    test('should handle undefined input', () => {
      mockJsonParse.mockReturnValue(null);
      mockExtractData.mockReturnValue({ analysis: { issues: [], suggestions: [] } });
      
      const result = parseAnalysisResponse(undefined as any);
      
      expect(mockExtractData).toHaveBeenCalled();
      expect(result.analysis).toBeDefined();
    });

    test('should handle null input', () => {
      mockJsonParse.mockReturnValue(null);
      mockExtractData.mockReturnValue({ analysis: { issues: [], suggestions: [] } });
      
      const result = parseAnalysisResponse(null as any);
      
      expect(mockExtractData).toHaveBeenCalled();
      expect(result.analysis).toBeDefined();
    });

    test('should handle response with unexpected structure', () => {
      const unexpectedResponse = '{"data": "something else"}';
      const expectedParsed = { data: 'something else' };
      
      mockJsonParse.mockReturnValue(expectedParsed);
      
      const result = parseAnalysisResponse(unexpectedResponse);
      
      expect(result).toEqual(expectedParsed);
    });

    test('should handle response with circular references fallback', () => {
      const response = 'circular reference object';
      const fallbackData = { analysis: { issues: [], suggestions: [], error: 'circular reference' } };
      
      mockJsonParse.mockReturnValue(null);
      mockExtractData.mockReturnValue(fallbackData);
      
      const result = parseAnalysisResponse(response);
      
      expect(result).toEqual(fallbackData);
    });
  });

  describe('Integration Scenarios', () => {
    test('should prioritize JSON parsing over natural language extraction', () => {
      const response = '{"analysis": {"issues": []}}';
      const parsedData = { analysis: { issues: [] } };
      
      mockJsonParse.mockReturnValue(parsedData);
      
      const result = parseAnalysisResponse(response);
      
      expect(mockJsonParse).toHaveBeenCalled();
      expect(mockExtractData).not.toHaveBeenCalled();
      expect(result).toEqual(parsedData);
    });

    test('should fall back to natural language when JSON parsing returns null', () => {
      const response = 'Not a JSON response';
      const extractedData = { analysis: { issues: [{ message: 'Extracted issue' }] } };
      
      mockJsonParse.mockReturnValue(null);
      mockExtractData.mockReturnValue(extractedData);
      
      const result = parseAnalysisResponse(response);
      
      expect(mockJsonParse).toHaveBeenCalledWith(response);
      expect(mockExtractData).toHaveBeenCalledWith(response);
      expect(result).toEqual(extractedData);
    });

    test('should preserve data types in parsed response', () => {
      const response = '{"analysis": {"count": 42, "enabled": true, "ratio": 3.14}}';
      const parsedData = { analysis: { count: 42, enabled: true, ratio: 3.14 } };
      
      mockJsonParse.mockReturnValue(parsedData);
      
      const result = parseAnalysisResponse(response);
      
      expect(result.analysis.count).toBe(42);
      expect(result.analysis.enabled).toBe(true);
      expect(result.analysis.ratio).toBe(3.14);
    });
  });
});