import { InsightsTreeProvider, InsightItem } from '../insightsTreeView';
import * as vscode from 'vscode';
import { InsightsTreeProvider } from '../insightsTreeView';

// Test: test_getChildren_builds_hierarchy
// Verifies tree view correctly builds hierarchical structure from flat insights
import { InsightsTreeProvider, InsightItem } from '../insightsTreeView';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('InsightsTreeView - getChildren', () => {
  let treeProvider: InsightsTreeProvider;

  beforeEach(() => {
    treeProvider = new InsightsTreeProvider();
  });

  test('returns category nodes at root level', async () => {
    const insights = {
      issues: [
        { severity: 'error', category: 'Code Organization', description: 'Issue 1', file: 'a.ts' },
        { severity: 'warning', category: 'Dependencies', description: 'Issue 2', file: 'b.ts' }
      ]
    };
    treeProvider.update(insights);

    const children = await treeProvider.getChildren();

    expect(children.length).toBeGreaterThan(0);
    const categories = children.map((c: any) => c.label);
    expect(categories).toContain('Code Organization');
    expect(categories).toContain('Dependencies');
  });

  test('returns issue nodes under category', async () => {
    const insights = {
      issues: [
        { severity: 'error', category: 'Code Organization', description: 'Issue 1', file: 'a.ts', line: 10 },
        { severity: 'error', category: 'Code Organization', description: 'Issue 2', file: 'b.ts', line: 20 }
      ]
    };
    treeProvider.update(insights);

    const rootChildren = await treeProvider.getChildren();
    const categoryNode = rootChildren.find((c: any) => c.label === 'Code Organization');
    const issueChildren = await treeProvider.getChildren(categoryNode);

    expect(issueChildren.length).toBe(2);
  });

  test('returns empty array for leaf nodes', async () => {
    const insights = {
      issues: [
        { severity: 'error', category: 'Code Organization', description: 'Issue', file: 'a.ts', line: 10 }
      ]
    };
    treeProvider.update(insights);

    const rootChildren = await treeProvider.getChildren();
    const categoryNode = rootChildren[0];
    const issueChildren = await treeProvider.getChildren(categoryNode);
    const leafChildren = await treeProvider.getChildren(issueChildren[0]);

    expect(leafChildren.length).toBe(0);
  });
});

// Test: test_update_refreshes_tree
// Verifies tree view refresh mechanism when insights change
import { InsightsTreeProvider } from '../insightsTreeView';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('InsightsTreeView - update', () => {
  let treeProvider: InsightsTreeProvider;
  let mockOnDidChangeTreeData: jest.Mock;

  beforeEach(() => {
    mockOnDidChangeTreeData = jest.fn();
    treeProvider = new InsightsTreeProvider();
    (treeProvider as any)._onDidChangeTreeData = {
      fire: mockOnDidChangeTreeData
    };
  });

  test('triggers refresh event on update', () => {
    const insights = {
      issues: [
        { severity: 'error', category: 'Test', description: 'Issue', file: 'test.ts' }
      ]
    };

    treeProvider.update(insights);

    expect(mockOnDidChangeTreeData).toHaveBeenCalled();
  });

  test('replaces old insights with new ones', async () => {
    const oldInsights = {
      issues: [
        { severity: 'error', category: 'Old', description: 'Old issue', file: 'old.ts' }
      ]
    };
    treeProvider.update(oldInsights);

    const newInsights = {
      issues: [
        { severity: 'warning', category: 'New', description: 'New issue', file: 'new.ts' }
      ]
    };
    treeProvider.update(newInsights);

    const children = await treeProvider.getChildren();
    const categories = children.map((c: any) => c.label);

    expect(categories).toContain('New');
    expect(categories).not.toContain('Old');
  });

  test('handles empty insights gracefully', async () => {
    treeProvider.update({ issues: [] });

    const children = await treeProvider.getChildren();

    expect(children.length).toBe(0);
  });
});
