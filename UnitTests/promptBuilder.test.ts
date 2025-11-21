import { buildPromptForAnalysis } from '../promptBuilder';
import { templateEngine } from '../templateEngine';
import { contextFormatter } from '../contextFormatter';

// Mocks
jest.mock('../templateEngine');
jest.mock('../contextFormatter');

describe('buildPromptForAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    it('should build a valid prompt with complete input data', () => {
      const mockTemplate = 'Analysis prompt: {context} - {data}';
      const mockFormattedContext = 'formatted context data';
      const mockResult = 'Analysis prompt: formatted context data - test data';
      
      (templateEngine as any).getTemplate = jest.fn().mockReturnValue(mockTemplate);
      (templateEngine as any).render = jest.fn().mockReturnValue(mockResult);
      (contextFormatter as any).format = jest.fn().mockReturnValue(mockFormattedContext);

      const input = {
        context: { file: 'test.ts', line: 10 },
        data: 'test data',
        analysisType: 'complexity'
      };

      const result = buildPromptForAnalysis(input);

      expect(result).toBe(mockResult);
      expect(templateEngine.getTemplate).toHaveBeenCalledWith('complexity');
      expect(contextFormatter.format).toHaveBeenCalledWith(input.context);
      expect(templateEngine.render).toHaveBeenCalled();
    });

    it('should handle multiple analysis types correctly', () => {
      const analysisTypes = ['complexity', 'security', 'performance'];
      
      (templateEngine as any).getTemplate = jest.fn().mockReturnValue('template');
      (templateEngine as any).render = jest.fn().mockReturnValue('rendered prompt');
      (contextFormatter as any).format = jest.fn().mockReturnValue('context');

      analysisTypes.forEach(type => {
        const input = { context: {}, data: 'data', analysisType: type };
        const result = buildPromptForAnalysis(input);
        
        expect(result).toBe('rendered prompt');
        expect(templateEngine.getTemplate).toHaveBeenCalledWith(type);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty context object', () => {
      (templateEngine as any).getTemplate = jest.fn().mockReturnValue('template');
      (templateEngine as any).render = jest.fn().mockReturnValue('prompt');
      (contextFormatter as any).format = jest.fn().mockReturnValue('');

      const input = {
        context: {},
        data: 'test data',
        analysisType: 'complexity'
      };

      const result = buildPromptForAnalysis(input);

      expect(result).toBe('prompt');
      expect(contextFormatter.format).toHaveBeenCalledWith({});
    });

    it('should handle empty data string', () => {
      (templateEngine as any).getTemplate = jest.fn().mockReturnValue('template');
      (templateEngine as any).render = jest.fn().mockReturnValue('prompt with empty data');
      (contextFormatter as any).format = jest.fn().mockReturnValue('context');

      const input = {
        context: { file: 'test.ts' },
        data: '',
        analysisType: 'complexity'
      };

      const result = buildPromptForAnalysis(input);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle very large input data', () => {
      const largeData = 'x'.repeat(100000);
      
      (templateEngine as any).getTemplate = jest.fn().mockReturnValue('template');
      (templateEngine as any).render = jest.fn().mockReturnValue('rendered');
      (contextFormatter as any).format = jest.fn().mockReturnValue('context');

      const input = {
        context: { file: 'large.ts' },
        data: largeData,
        analysisType: 'complexity'
      };

      const result = buildPromptForAnalysis(input);

      expect(result).toBeDefined();
      expect(templateEngine.render).toHaveBeenCalled();
    });

    it('should handle special characters in data', () => {
      const specialData = 'data with \n\t\r special chars & symbols <>';
      
      (templateEngine as any).getTemplate = jest.fn().mockReturnValue('template');
      (templateEngine as any).render = jest.fn().mockReturnValue('escaped prompt');
      (contextFormatter as any).format = jest.fn().mockReturnValue('context');

      const input = {
        context: { file: 'test.ts' },
        data: specialData,
        analysisType: 'security'
      };

      const result = buildPromptForAnalysis(input);

      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw error when template engine fails', () => {
      (templateEngine as any).getTemplate = jest.fn().mockImplementation(() => {
        throw new Error('Template not found');
      });

      const input = {
        context: { file: 'test.ts' },
        data: 'data',
        analysisType: 'invalid'
      };

      expect(() => buildPromptForAnalysis(input)).toThrow('Template not found');
    });

    it('should throw error when context formatter fails', () => {
      (templateEngine as any).getTemplate = jest.fn().mockReturnValue('template');
      (contextFormatter as any).format = jest.fn().mockImplementation(() => {
        throw new Error('Invalid context format');
      });

      const input = {
        context: { invalid: true },
        data: 'data',
        analysisType: 'complexity'
      };

      expect(() => buildPromptForAnalysis(input)).toThrow('Invalid context format');
    });

    it('should throw error when render fails', () => {
      (templateEngine as any).getTemplate = jest.fn().mockReturnValue('template');
      (contextFormatter as any).format = jest.fn().mockReturnValue('context');
      (templateEngine as any).render = jest.fn().mockImplementation(() => {
        throw new Error('Render failed');
      });

      const input = {
        context: { file: 'test.ts' },
        data: 'data',
        analysisType: 'complexity'
      };

      expect(() => buildPromptForAnalysis(input)).toThrow('Render failed');
    });

    it('should handle null input gracefully', () => {
      expect(() => buildPromptForAnalysis(null as any)).toThrow();
    });

    it('should handle undefined input gracefully', () => {
      expect(() => buildPromptForAnalysis(undefined as any)).toThrow();
    });

    it('should handle missing required fields', () => {
      const input = {
        context: { file: 'test.ts' }
      } as any;

      expect(() => buildPromptForAnalysis(input)).toThrow();
    });
  });
});