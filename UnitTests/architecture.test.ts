import { generateArchitectureInsights } from '../architecture';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
const mockAIProvider = { generateInsights: jest.fn() };
const mockDependencyGraph = { analyze: jest.fn(), getNodes: jest.fn(), getEdges: jest.fn() };
const mockComponentAnalyzer = { analyzeComponents: jest.fn(), getComplexity: jest.fn() };

describe('generateArchitectureInsights', () => {
  let mockAIProvider: any;
  let mockDependencyGraph: any;
  let mockComponentAnalyzer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAIProvider = {
      generateInsights: jest.fn().mockResolvedValue({
        insights: ['Architecture follows modular design', 'Good separation of concerns'],
        recommendations: ['Consider adding more tests', 'Document API endpoints']
      })
    };
    
    mockDependencyGraph = {
      analyze: jest.fn().mockResolvedValue({
        nodes: [{ id: 'module1', type: 'component' }, { id: 'module2', type: 'service' }],
        edges: [{ from: 'module1', to: 'module2', type: 'imports' }]
      }),
      getNodes: jest.fn().mockReturnValue([{ id: 'module1' }, { id: 'module2' }]),
      getEdges: jest.fn().mockReturnValue([{ from: 'module1', to: 'module2' }])
    };
    
    mockComponentAnalyzer = {
      analyzeComponents: jest.fn().mockResolvedValue([
        { name: 'ComponentA', complexity: 5, lines: 100 },
        { name: 'ComponentB', complexity: 8, lines: 200 }
      ]),
      getComplexity: jest.fn().mockReturnValue(6.5)
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path', () => {
    test('should generate architecture insights successfully with valid inputs', async () => {
      const workspacePath = '/test/workspace';
      const options = { includeMetrics: true, includeRecommendations: true };
      
      const result = await generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer,
        options
      );

      expect(result).toBeDefined();
      expect(result.insights).toHaveLength(2);
      expect(result.recommendations).toHaveLength(2);
      expect(mockDependencyGraph.analyze).toHaveBeenCalledWith(workspacePath);
      expect(mockComponentAnalyzer.analyzeComponents).toHaveBeenCalledWith(workspacePath);
      expect(mockAIProvider.generateInsights).toHaveBeenCalled();
    });

    test('should handle minimal options and generate basic insights', async () => {
      const workspacePath = '/test/workspace';
      const options = { includeMetrics: false, includeRecommendations: false };
      
      mockAIProvider.generateInsights.mockResolvedValue({
        insights: ['Basic architecture analysis'],
        recommendations: []
      });

      const result = await generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer,
        options
      );

      expect(result).toBeDefined();
      expect(result.insights).toHaveLength(1);
      expect(result.recommendations).toHaveLength(0);
    });

    test('should process complex dependency graphs correctly', async () => {
      const workspacePath = '/test/workspace';
      const complexGraph = {
        nodes: Array.from({ length: 50 }, (_, i) => ({ id: `module${i}`, type: 'component' })),
        edges: Array.from({ length: 100 }, (_, i) => ({ from: `module${i % 50}`, to: `module${(i + 1) % 50}`, type: 'imports' }))
      };
      
      mockDependencyGraph.analyze.mockResolvedValue(complexGraph);
      mockDependencyGraph.getNodes.mockReturnValue(complexGraph.nodes);
      mockDependencyGraph.getEdges.mockReturnValue(complexGraph.edges);

      const result = await generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer,
        { includeMetrics: true }
      );

      expect(result).toBeDefined();
      expect(mockDependencyGraph.analyze).toHaveBeenCalledWith(workspacePath);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty workspace gracefully', async () => {
      const workspacePath = '/empty/workspace';
      
      mockDependencyGraph.analyze.mockResolvedValue({ nodes: [], edges: [] });
      mockComponentAnalyzer.analyzeComponents.mockResolvedValue([]);
      mockAIProvider.generateInsights.mockResolvedValue({
        insights: ['No components found'],
        recommendations: ['Add components to the workspace']
      });

      const result = await generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      );

      expect(result).toBeDefined();
      expect(result.insights).toContain('No components found');
    });

    test('should handle undefined or null workspace path', async () => {
      const workspacePath = '';

      await expect(generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      )).rejects.toThrow();
    });

    test('should handle missing options parameter with defaults', async () => {
      const workspacePath = '/test/workspace';

      const result = await generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      );

      expect(result).toBeDefined();
      expect(mockDependencyGraph.analyze).toHaveBeenCalled();
    });

    test('should handle components with zero complexity', async () => {
      mockComponentAnalyzer.analyzeComponents.mockResolvedValue([
        { name: 'SimpleComponent', complexity: 0, lines: 10 }
      ]);
      mockComponentAnalyzer.getComplexity.mockReturnValue(0);

      const result = await generateArchitectureInsights(
        '/test/workspace',
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      );

      expect(result).toBeDefined();
    });

    test('should handle circular dependencies in graph', async () => {
      mockDependencyGraph.analyze.mockResolvedValue({
        nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
        edges: [
          { from: 'A', to: 'B' },
          { from: 'B', to: 'C' },
          { from: 'C', to: 'A' }
        ]
      });

      const result = await generateArchitectureInsights(
        '/test/workspace',
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      );

      expect(result).toBeDefined();
      expect(mockDependencyGraph.analyze).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle AI provider failure gracefully', async () => {
      const workspacePath = '/test/workspace';
      mockAIProvider.generateInsights.mockRejectedValue(new Error('AI service unavailable'));

      await expect(generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      )).rejects.toThrow('AI service unavailable');
    });

    test('should handle dependency graph analysis failure', async () => {
      const workspacePath = '/test/workspace';
      mockDependencyGraph.analyze.mockRejectedValue(new Error('Failed to analyze dependencies'));

      await expect(generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      )).rejects.toThrow('Failed to analyze dependencies');
    });

    test('should handle component analyzer failure', async () => {
      const workspacePath = '/test/workspace';
      mockComponentAnalyzer.analyzeComponents.mockRejectedValue(new Error('Analysis failed'));

      await expect(generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      )).rejects.toThrow('Analysis failed');
    });

    test('should handle malformed AI response', async () => {
      const workspacePath = '/test/workspace';
      mockAIProvider.generateInsights.mockResolvedValue(null);

      await expect(generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      )).rejects.toThrow();
    });

    test('should handle timeout in dependency analysis', async () => {
      const workspacePath = '/test/workspace';
      mockDependencyGraph.analyze.mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      await expect(generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      )).rejects.toThrow('Timeout');
    });

    test('should handle invalid workspace path format', async () => {
      const workspacePath = 'invalid\\path\\format';

      await expect(generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      )).rejects.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    test('should correctly integrate all dependencies for complete analysis', async () => {
      const workspacePath = '/test/workspace';
      const options = {
        includeMetrics: true,
        includeRecommendations: true,
        depth: 3
      };

      const result = await generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer,
        options
      );

      expect(mockDependencyGraph.analyze).toHaveBeenCalledWith(workspacePath);
      expect(mockComponentAnalyzer.analyzeComponents).toHaveBeenCalledWith(workspacePath);
      expect(mockAIProvider.generateInsights).toHaveBeenCalled();
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    test('should handle partial failures with fallback data', async () => {
      const workspacePath = '/test/workspace';
      
      mockComponentAnalyzer.analyzeComponents.mockResolvedValue([]);
      mockAIProvider.generateInsights.mockResolvedValue({
        insights: ['Limited analysis available'],
        recommendations: ['Fix component analyzer']
      });

      const result = await generateArchitectureInsights(
        workspacePath,
        mockAIProvider,
        mockDependencyGraph,
        mockComponentAnalyzer
      );

      expect(result).toBeDefined();
      expect(result.insights).toContain('Limited analysis available');
    });
  });
});