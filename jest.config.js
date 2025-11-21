module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/UnitTests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'commonjs',
        target: 'ES2020',
        lib: ['ES2020'],
        strict: false,
        skipLibCheck: true,
        resolveJsonModule: true,
        moduleResolution: 'node',
        baseUrl: '.',
        paths: {
          '*': ['src/*', 'node_modules/*']
        }
      }
    }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/test/**',
    '!src/**/__mocks__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/test/__mocks__/vscode.ts'
  },
  modulePaths: ['<rootDir>/src', '<rootDir>'],
  testTimeout: 10000
};

