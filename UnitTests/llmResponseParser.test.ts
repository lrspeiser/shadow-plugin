import { parseProductDocsResponse } from '../../ai/llmResponseParser';
import { parseArchitectureInsights } from '../../ai/llmResponseParser';

// Test: test_parseProductDocsResponse_validates_schema
// Verifies parseProductDocsResponse correctly parses and validates AI-generated product documentation against schema
import { parseProductDocsResponse } from '../../ai/llmResponseParser';

describe('parseProductDocsResponse', () => {
  it('parses valid product documentation JSON', () => {
    const validResponse = JSON.stringify({
      overview: 'Product overview text',
      features: ['Feature 1', 'Feature 2'],
      userWorkflows: ['Workflow 1'],
      architecture: 'Architecture description'
    });
    
    const result = parseProductDocsResponse(validResponse);
    
    expect(result.overview).toBe('Product overview text');
    expect(result.features).toHaveLength(2);
    expect(result.features[0]).toBe('Feature 1');
    expect(result.architecture).toBe('Architecture description');
  });
  
  it('throws error for malformed JSON', () => {
    const malformedResponse = '{ invalid json';
    
    expect(() => parseProductDocsResponse(malformedResponse)).toThrow();
  });
  
  it('validates required fields are present', () => {
    const missingFields = JSON.stringify({
      overview: 'Overview only'
    });
    
    expect(() => parseProductDocsResponse(missingFields)).toThrow(
      expect.stringContaining('required')
    );
  });
  
  it('handles optional fields gracefully', () => {
    const minimalValid = JSON.stringify({
      overview: 'Overview',
      features: [],
      userWorkflows: [],
      architecture: 'Arch'
    });
    
    const result = parseProductDocsResponse(minimalValid);
    
    expect(result.features).toEqual([]);
    expect(result.userWorkflows).toEqual([]);
  });
  
  it('extracts nested documentation sections', () => {
    const nestedResponse = JSON.stringify({
      overview: 'Overview',
      features: [
        { name: 'Feature A', description: 'Desc A' },
        { name: 'Feature B', description: 'Desc B' }
      ],
      userWorkflows: ['Workflow'],
      architecture: 'Arch'
    });
    
    const result = parseProductDocsResponse(nestedResponse);
    
    expect(result.features[0]).toHaveProperty('name');
    expect(result.features[0]).toHaveProperty('description');
  });
});

// Test: test_parseArchitectureInsights_validates_patterns
// Verifies parseArchitectureInsights correctly parses AI-generated architecture analysis
import { parseArchitectureInsights } from '../../ai/llmResponseParser';

describe('parseArchitectureInsights', () => {
  it('parses valid architecture insights JSON', () => {
    const validResponse = JSON.stringify({
      patterns: [
        { name: 'MVC', confidence: 0.9 },
        { name: 'Repository', confidence: 0.8 }
      ],
      issues: ['Tight coupling in module A'],
      recommendations: ['Implement dependency injection']
    });
    
    const result = parseArchitectureInsights(validResponse);
    
    expect(result.patterns).toHaveLength(2);
    expect(result.patterns[0].name).toBe('MVC');
    expect(result.patterns[0].confidence).toBe(0.9);
    expect(result.issues).toContain('Tight coupling in module A');
  });
  
  it('handles empty insights response', () => {
    const emptyResponse = JSON.stringify({
      patterns: [],
      issues: [],
      recommendations: []
    });
    
    const result = parseArchitectureInsights(emptyResponse);
    
    expect(result.patterns).toEqual([]);
    expect(result.issues).toEqual([]);
    expect(result.recommendations).toEqual([]);
  });
  
  it('validates pattern confidence values', () => {
    const invalidConfidence = JSON.stringify({
      patterns: [{ name: 'MVC', confidence: 1.5 }],
      issues: [],
      recommendations: []
    });
    
    expect(() => parseArchitectureInsights(invalidConfidence)).toThrow(
      expect.stringContaining('confidence')
    );
  });
  
  it('extracts detailed recommendations', () => {
    const detailedResponse = JSON.stringify({
      patterns: [],
      issues: [],
      recommendations: [
        {
          priority: 'high',
          description: 'Extract service layer',
          rationale: 'Improve testability'
        }
      ]
    });
    
    const result = parseArchitectureInsights(detailedResponse);
    
    expect(result.recommendations[0]).toHaveProperty('priority');
    expect(result.recommendations[0]).toHaveProperty('description');
    expect(result.recommendations[0]).toHaveProperty('rationale');
  });
});
