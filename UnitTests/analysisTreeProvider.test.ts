import { AnalysisTreeProvider } from '../analysisTreeProvider';
import * as vscode from 'vscode';
import { AnalysisData, TreeNode } from '../../types';

// Mocks
jest.mock('vscode');

describe('AnalysisTreeProvider.getChildren', () => {
  let treeProvider: AnalysisTreeProvider;
  let mockAnalysisData: any;

  beforeEach(() => {
    treeProvider = new AnalysisTreeProvider();
    mockAnalysisData = {
      rootNodes: [
        {
          id: 'root1',
          label: 'Root Node 1',
          type: 'root',
          children: [
            {
              id: 'child1',
              label: 'Child Node 1',
              type: 'child',
              children: []
            },
            {
              id: 'child2',
              label: 'Child Node 2',
              type: 'child',
              children: []
            }
          ]
        },
        {
          id: 'root2',
          label: 'Root Node 2',
          type: 'root',
          children: []
        }
      ]
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return root nodes when element is undefined', async () => {
    treeProvider['analysisData'] = mockAnalysisData;

    const result = await treeProvider.getChildren(undefined);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('root1');
    expect(result[1].id).toBe('root2');
  });

  test('should return child nodes when element has children', async () => {
    treeProvider['analysisData'] = mockAnalysisData;
    const parentNode = mockAnalysisData.rootNodes[0];

    const result = await treeProvider.getChildren(parentNode);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('child1');
    expect(result[0].label).toBe('Child Node 1');
    expect(result[1].id).toBe('child2');
    expect(result[1].label).toBe('Child Node 2');
  });

  test('should return empty array when element has no children', async () => {
    treeProvider['analysisData'] = mockAnalysisData;
    const leafNode = mockAnalysisData.rootNodes[0].children[0];

    const result = await treeProvider.getChildren(leafNode);

    expect(result).toBeDefined();
    expect(result).toHaveLength(0);
  });

  test('should return empty array when analysisData is null', async () => {
    treeProvider['analysisData'] = null;

    const result = await treeProvider.getChildren(undefined);

    expect(result).toBeDefined();
    expect(result).toHaveLength(0);
  });

  test('should return empty array when analysisData is undefined', async () => {
    treeProvider['analysisData'] = undefined;

    const result = await treeProvider.getChildren(undefined);

    expect(result).toBeDefined();
    expect(result).toHaveLength(0);
  });

  test('should handle deeply nested tree structure', async () => {
    const deeplyNestedData = {
      rootNodes: [
        {
          id: 'level1',
          label: 'Level 1',
          type: 'node',
          children: [
            {
              id: 'level2',
              label: 'Level 2',
              type: 'node',
              children: [
                {
                  id: 'level3',
                  label: 'Level 3',
                  type: 'node',
                  children: []
                }
              ]
            }
          ]
        }
      ]
    };
    treeProvider['analysisData'] = deeplyNestedData;

    const level1Result = await treeProvider.getChildren(undefined);
    expect(level1Result).toHaveLength(1);
    expect(level1Result[0].id).toBe('level1');

    const level2Result = await treeProvider.getChildren(level1Result[0]);
    expect(level2Result).toHaveLength(1);
    expect(level2Result[0].id).toBe('level2');

    const level3Result = await treeProvider.getChildren(level2Result[0]);
    expect(level3Result).toHaveLength(1);
    expect(level3Result[0].id).toBe('level3');
  });

  test('should handle node with null children property', async () => {
    const dataWithNullChildren = {
      rootNodes: [
        {
          id: 'node1',
          label: 'Node 1',
          type: 'node',
          children: null
        }
      ]
    };
    treeProvider['analysisData'] = dataWithNullChildren;

    const result = await treeProvider.getChildren(dataWithNullChildren.rootNodes[0]);

    expect(result).toBeDefined();
    expect(result).toHaveLength(0);
  });

  test('should return empty array when rootNodes is empty', async () => {
    treeProvider['analysisData'] = { rootNodes: [] };

    const result = await treeProvider.getChildren(undefined);

    expect(result).toBeDefined();
    expect(result).toHaveLength(0);
  });

  test('should preserve node properties when returning children', async () => {
    const dataWithProperties = {
      rootNodes: [
        {
          id: 'parent',
          label: 'Parent',
          type: 'folder',
          description: 'Parent Description',
          tooltip: 'Parent Tooltip',
          children: [
            {
              id: 'child',
              label: 'Child',
              type: 'file',
              description: 'Child Description',
              tooltip: 'Child Tooltip',
              children: []
            }
          ]
        }
      ]
    };
    treeProvider['analysisData'] = dataWithProperties;

    const children = await treeProvider.getChildren(dataWithProperties.rootNodes[0]);

    expect(children[0].id).toBe('child');
    expect(children[0].label).toBe('Child');
    expect(children[0].type).toBe('file');
    expect(children[0].description).toBe('Child Description');
    expect(children[0].tooltip).toBe('Child Tooltip');
  });
});