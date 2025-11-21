// Mock VSCode API
global.vscode = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      clear: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn()
    })),
    createTreeView: jest.fn(),
    createWebviewPanel: jest.fn(),
    showQuickPick: jest.fn(),
    showInputBox: jest.fn(),
    withProgress: jest.fn((options, task) => task({ report: jest.fn() }))
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn(),
      update: jest.fn(),
      has: jest.fn(),
      inspect: jest.fn()
    })),
    workspaceFolders: [],
    fs: {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      stat: jest.fn(),
      readDirectory: jest.fn()
    },
    onDidChangeConfiguration: jest.fn(),
    onDidSaveTextDocument: jest.fn(),
    onDidChangeTextDocument: jest.fn(),
    createFileSystemWatcher: jest.fn(() => ({
      onDidCreate: jest.fn(),
      onDidChange: jest.fn(),
      onDidDelete: jest.fn(),
      dispose: jest.fn()
    }))
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn()
  },
  languages: {
    createDiagnosticCollection: jest.fn(() => ({
      set: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn()
    }))
  },
  Uri: {
    file: jest.fn((path) => ({ fsPath: path, path })),
    parse: jest.fn((uri) => ({ fsPath: uri, path: uri }))
  },
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3
  },
  Range: jest.fn(),
  Position: jest.fn(),
  Diagnostic: jest.fn(),
  EventEmitter: jest.fn(() => ({
    event: jest.fn(),
    fire: jest.fn(),
    dispose: jest.fn()
  })),
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3
  }
};

// Mock external APIs
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('axios');

// Global test utilities
global.createMockContext = () => ({
  subscriptions: [],
  workspaceState: {
    get: jest.fn(),
    update: jest.fn()
  },
  globalState: {
    get: jest.fn(),
    update: jest.fn(),
    setKeysForSync: jest.fn()
  },
  extensionPath: '/mock/extension/path',
  extensionUri: { fsPath: '/mock/extension/path' },
  storagePath: '/mock/storage/path',
  globalStoragePath: '/mock/global/storage/path',
  logPath: '/mock/log/path'
});

beforeEach(() => {
  jest.clearAllMocks();
});