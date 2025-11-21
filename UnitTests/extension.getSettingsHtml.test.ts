import * as vscode from 'vscode';
import { getConfigurationManager } from '../src/configuration';
import { WebviewTemplateEngine } from '../src/webview-messaging';

// Mocks
jest.mock('vscode');
jest.mock('../src/configuration');
jest.mock('../src/webview-messaging');

describe('getSettingsHtml', () => {
  let mockConfigManager: any;
  let mockEngine: any;
  let getSettingsHtml: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock configuration manager
    mockConfigManager = {
      openaiApiKey: '',
      claudeApiKey: ''
    };
    
    (getConfigurationManager as jest.Mock).mockReturnValue(mockConfigManager);
    
    // Setup mock WebviewTemplateEngine
    mockEngine = {
      render: jest.fn((options) => `<html>${options.title}${options.content}${options.customStyles}${options.customScript}</html>`)
    };
    
    (WebviewTemplateEngine as jest.Mock).mockImplementation(() => mockEngine);
    (WebviewTemplateEngine.escapeHtml as jest.Mock) = jest.fn((str) => str);
    
    // Import function after mocks are set up
    const extension = require('../src/extension');
    getSettingsHtml = extension.getSettingsHtml;
  });

  describe('Provider Display', () => {
    test('should display OpenAI as current provider when openai is selected', () => {
      mockConfigManager.openaiApiKey = 'test-key';
      
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('OpenAI');
      expect(result).toContain('Switch to Claude');
    });

    test('should display Claude as current provider when claude is selected', () => {
      mockConfigManager.claudeApiKey = 'test-key';
      
      const result = getSettingsHtml('claude');
      
      expect(result).toContain('Claude');
      expect(result).toContain('Switch to OpenAI');
    });
  });

  describe('API Key Status', () => {
    test('should show warning when OpenAI is selected but key is not set', () => {
      mockConfigManager.openaiApiKey = '';
      mockConfigManager.claudeApiKey = 'claude-key';
      
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('WARNING: OpenAI is selected but OpenAI API key is not set!');
    });

    test('should show warning when Claude is selected but key is not set', () => {
      mockConfigManager.openaiApiKey = 'openai-key';
      mockConfigManager.claudeApiKey = '';
      
      const result = getSettingsHtml('claude');
      
      expect(result).toContain('WARNING: Claude is selected but Claude API key is not set!');
    });

    test('should show success message when current provider has API key', () => {
      mockConfigManager.openaiApiKey = 'test-openai-key';
      
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('Current provider has API key configured');
    });

    test('should handle whitespace-only API keys as not set', () => {
      mockConfigManager.openaiApiKey = '   ';
      mockConfigManager.claudeApiKey = '\t\n';
      
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('Not set');
    });

    test('should display status for both OpenAI and Claude keys', () => {
      mockConfigManager.openaiApiKey = 'openai-key';
      mockConfigManager.claudeApiKey = '';
      
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('OpenAI: Set');
      expect(result).toContain('Claude: Not set');
    });

    test('should show both keys as set when both are configured', () => {
      mockConfigManager.openaiApiKey = 'openai-key';
      mockConfigManager.claudeApiKey = 'claude-key';
      
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('OpenAI: Set');
      expect(result).toContain('Claude: Set');
    });
  });

  describe('HTML Structure', () => {
    test('should call WebviewTemplateEngine render with correct structure', () => {
      mockConfigManager.openaiApiKey = 'test-key';
      
      getSettingsHtml('openai');
      
      expect(mockEngine.render).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Shadow Watch Settings',
          content: expect.any(String),
          customStyles: expect.any(String),
          customScript: expect.any(String)
        })
      );
    });

    test('should include all required sections in content', () => {
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('Shadow Watch Settings');
      expect(result).toContain('LLM Provider');
      expect(result).toContain('Menu Structure');
      expect(result).toContain('All Settings');
    });

    test('should include JavaScript functions for button handlers', () => {
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('function switchProvider()');
      expect(result).toContain('function copyMenuStructure()');
      expect(result).toContain('function openVSCodeSettings()');
    });

    test('should include postMessage commands', () => {
      const result = getSettingsHtml('openai');
      
      expect(result).toContain("vscode.postMessage({ command: 'switchProvider' })");
      expect(result).toContain("vscode.postMessage({ command: 'copyMenuStructure' })");
      expect(result).toContain("vscode.postMessage({ command: 'openVSCodeSettings' })");
    });

    test('should include custom styles for layout', () => {
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('max-width: 800px');
      expect(result).toContain('background: white');
      expect(result).toContain('border-radius');
    });
  });

  describe('HTML Escaping', () => {
    test('should call escapeHtml for provider names', () => {
      mockConfigManager.openaiApiKey = 'test-key';
      
      getSettingsHtml('openai');
      
      expect(WebviewTemplateEngine.escapeHtml).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined API keys', () => {
      mockConfigManager.openaiApiKey = undefined;
      mockConfigManager.claudeApiKey = undefined;
      
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('Not set');
    });

    test('should handle null API keys', () => {
      mockConfigManager.openaiApiKey = null;
      mockConfigManager.claudeApiKey = null;
      
      const result = getSettingsHtml('claude');
      
      expect(result).toContain('Not set');
    });

    test('should create new WebviewTemplateEngine instance', () => {
      getSettingsHtml('openai');
      
      expect(WebviewTemplateEngine).toHaveBeenCalled();
    });

    test('should return string output from render', () => {
      const result = getSettingsHtml('openai');
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Button Elements', () => {
    test('should include switch provider button with onclick handler', () => {
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('onclick="switchProvider()"');
      expect(result).toContain('Switch to Claude');
    });

    test('should include copy menu structure button', () => {
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('onclick="copyMenuStructure()"');
      expect(result).toContain('Copy Menu Structure');
    });

    test('should include open settings button', () => {
      const result = getSettingsHtml('openai');
      
      expect(result).toContain('onclick="openVSCodeSettings()"');
      expect(result).toContain('Open VSCode Settings');
    });
  });
});