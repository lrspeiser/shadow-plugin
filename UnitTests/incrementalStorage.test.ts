import { IncrementalStorage } from '../storage/incrementalStorage';
import * as fs from 'fs';
jest.mock('fs');

// Test: test_save_and_retrieve_partial_results
// Verifies incremental storage can save and retrieve partial analysis results
describe('IncrementalStorage - savePartialResults', () => {
  let storage: IncrementalStorage;
  const mockStoragePath = '/mock/storage';

  beforeEach(() => {
    storage = new IncrementalStorage(mockStoragePath);
    jest.clearAllMocks();
  });

  test('should save partial results to storage', async () => {
    const partialResult = {
      file: 'test.ts',
      insights: [{ type: 'warning', message: 'Test warning' }],
      timestamp: Date.now()
    };

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    await storage.savePartialResults('test.ts', partialResult);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('test.ts'),
      expect.any(String)
    );
  });

  test('should retrieve saved partial results', async () => {
    const savedResult = {
      file: 'test.ts',
      insights: [{ type: 'warning', message: 'Test warning' }],
      timestamp: Date.now()
    };

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(savedResult));

    const retrieved = await storage.getPartialResults('test.ts');

    expect(retrieved).toEqual(savedResult);
  });

  test('should handle missing storage file', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = await storage.getPartialResults('nonexistent.ts');

    expect(result).toBeNull();
  });

  test('should merge multiple partial results', async () => {
    const results = [
      { file: 'file1.ts', insights: [{ type: 'error' }] },
      { file: 'file2.ts', insights: [{ type: 'warning' }] },
      { file: 'file3.ts', insights: [{ type: 'info' }] }
    ];

    const merged = storage.mergePartialResults(results);

    expect(merged.insights).toHaveLength(3);
    expect(merged.files).toHaveLength(3);
  });
});
