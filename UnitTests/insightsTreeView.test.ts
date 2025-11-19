import { InsightsTreeView } from '../insightsTreeView';
import * as vscode from 'vscode';
jest.mock('vscode');

// Test: test_render_insights_tree_structure
// Verifies tree view renders insights in correct hierarchical structure
describe('InsightsTreeView - getChildren', () => {
  let treeView: InsightsTreeView;

  beforeEach(() => {
    treeView = new InsightsTreeView();
    jest.clearAllMocks();
  });

  test('should return empty array for no insights', async () => {
    treeView.updateInsights([]);

    const children = await treeView.getChildren();

    expect(children).toEqual([]);
  });

  test('should render category nodes for insights', async () => {
    const mockInsights = [
      { category: 'dependencies', severity: 'Error', description: 'Circular dependency' },
      { category: 'complexity', severity: 'Warning', description: 'Complex function' }
    ];

    treeView.updateInsights(mockInsights);

    const children = await treeView.getChildren();

    expect(children.length).toBe(2);
    expect(children.some((c: any) => c.label === 'Dependencies')).toBe(true);
    expect(children.some((c: any) => c.label === 'Complexity')).toBe(true);
  });

  test('should group insights by category', async () => {
    const mockInsights = [
      { category: 'dependencies', severity: 'Error', description: 'Issue 1' },
      { category: 'dependencies', severity: 'Warning', description: 'Issue 2' },
      { category: 'complexity', severity: 'Error', description: 'Issue 3' }
    ];

    treeView.updateInsights(mockInsights);

    const categoryChildren = await treeView.getChildren();
    const dependencyNode = categoryChildren.find((c: any) => c.label === 'Dependencies');
    const dependencyInsights = await treeView.getChildren(dependencyNode);

    expect(dependencyInsights.length).toBe(2);
  });
});
