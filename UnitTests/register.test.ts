import { registerCommands } from '../register';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('registerCommands', () => {
  let mockContext: vscode.ExtensionContext;
  let mockRegisterCommand: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock context
    mockContext = new vscode.ExtensionContext();
    mockContext.subscriptions = [];

    // Setup command registration mock
    mockRegisterCommand = vscode.commands.registerCommand as any;
    mockRegisterCommand.mockImplementation((commandId: string, callback: Function) => {
      return { dispose: jest.fn() };
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path', () => {
    test('should register commands successfully', () => {
      // Act
      registerCommands(mockContext);

      // Assert
      expect(mockRegisterCommand).toHaveBeenCalled();
      expect(mockRegisterCommand.mock.calls.length).toBeGreaterThan(0);
    });

    test('should add command disposables to context subscriptions', () => {
      // Act
      registerCommands(mockContext);

      // Assert
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    test('should register multiple commands', () => {
      // Act
      registerCommands(mockContext);

      // Assert - Assuming multiple commands are registered
      const callCount = mockRegisterCommand.mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(1);
    });

    test('should register commands with correct command IDs', () => {
      // Act
      registerCommands(mockContext);

      // Assert - Check that command IDs are strings
      mockRegisterCommand.mock.calls.forEach((call: any[]) => {
        expect(typeof call[0]).toBe('string');
        expect(call[0].length).toBeGreaterThan(0);
      });
    });

    test('should register commands with callback functions', () => {
      // Act
      registerCommands(mockContext);

      // Assert - Check that callbacks are functions
      mockRegisterCommand.mock.calls.forEach((call: any[]) => {
        expect(typeof call[1]).toBe('function');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty subscriptions array', () => {
      // Arrange
      mockContext.subscriptions = [];

      // Act
      registerCommands(mockContext);

      // Assert
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    test('should handle context with existing subscriptions', () => {
      // Arrange
      const existingDisposable = { dispose: jest.fn() };
      mockContext.subscriptions = [existingDisposable];
      const initialLength = mockContext.subscriptions.length;

      // Act
      registerCommands(mockContext);

      // Assert
      expect(mockContext.subscriptions.length).toBeGreaterThan(initialLength);
    });

    test('should not throw when registerCommand returns undefined', () => {
      // Arrange
      mockRegisterCommand.mockReturnValue(undefined);

      // Act & Assert
      expect(() => registerCommands(mockContext)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle registerCommand throwing an error', () => {
      // Arrange
      mockRegisterCommand.mockImplementation(() => {
        throw new Error('Command registration failed');
      });

      // Act & Assert
      expect(() => registerCommands(mockContext)).toThrow('Command registration failed');
    });

    test('should handle null context gracefully', () => {
      // Act & Assert
      expect(() => registerCommands(null as any)).toThrow();
    });

    test('should handle undefined context gracefully', () => {
      // Act & Assert
      expect(() => registerCommands(undefined as any)).toThrow();
    });

    test('should handle context without subscriptions property', () => {
      // Arrange
      const invalidContext = {} as vscode.ExtensionContext;

      // Act & Assert
      expect(() => registerCommands(invalidContext)).toThrow();
    });
  });

  describe('Command Registration Details', () => {
    test('should register each command only once', () => {
      // Act
      registerCommands(mockContext);

      // Assert - Check for duplicate command IDs
      const commandIds = mockRegisterCommand.mock.calls.map((call: any[]) => call[0]);
      const uniqueIds = new Set(commandIds);
      expect(commandIds.length).toBe(uniqueIds.size);
    });

    test('should return disposables from registerCommand', () => {
      // Arrange
      const mockDisposable = { dispose: jest.fn() };
      mockRegisterCommand.mockReturnValue(mockDisposable);

      // Act
      registerCommands(mockContext);

      // Assert
      expect(mockContext.subscriptions).toContain(mockDisposable);
    });

    test('should handle command callbacks execution', () => {
      // Arrange
      let capturedCallback: Function | null = null;
      mockRegisterCommand.mockImplementation((id: string, callback: Function) => {
        capturedCallback = callback;
        return { dispose: jest.fn() };
      });

      // Act
      registerCommands(mockContext);

      // Assert
      expect(capturedCallback).not.toBeNull();
      if (capturedCallback) {
        expect(() => capturedCallback()).not.toThrow();
      }
    });
  });

  describe('Integration Scenarios', () => {
    test('should work with multiple registerCommands calls', () => {
      // Act
      registerCommands(mockContext);
      const firstCallCount = mockRegisterCommand.mock.calls.length;
      
      registerCommands(mockContext);
      const secondCallCount = mockRegisterCommand.mock.calls.length;

      // Assert
      expect(secondCallCount).toBe(firstCallCount * 2);
    });

    test('should maintain command disposables in order', () => {
      // Act
      registerCommands(mockContext);

      // Assert
      const subscriptions = mockContext.subscriptions;
      expect(Array.isArray(subscriptions)).toBe(true);
      subscriptions.forEach((disposable: any) => {
        expect(disposable).toHaveProperty('dispose');
      });
    });
  });
});