/**
 * Unit Tests Navigator - Browse unit tests from unit test plan
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface UnitTestPlan {
    overview?: any;
    file_analyses?: any[];
    rationale?: string;
    aggregated_plan?: {
        unit_test_plan?: any;
        test_suites?: any[];
        read_write_test_suites?: any[];
        user_workflow_test_suites?: any[];
    };
}

export class UnitTestsNavigatorProvider implements vscode.TreeDataProvider<UnitTestItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<UnitTestItem | undefined | null | void> = 
        new vscode.EventEmitter<UnitTestItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<UnitTestItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    private unitTestPlan: UnitTestPlan | null = null;
    private workspaceRoot: string | null = null;
    private fileWatcher: vscode.FileSystemWatcher | undefined;

    constructor(private context: vscode.ExtensionContext) {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            this.workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            this.setupFileWatcher();
            this.loadUnitTestPlan();
        }
    }

    private setupFileWatcher(): void {
        if (!this.workspaceRoot) return;

        const unitTestPlanPath = path.join(this.workspaceRoot, '.shadow', 'UnitTests', 'unit_test_plan.json');
        const watchPattern = new vscode.RelativePattern(
            vscode.workspace.workspaceFolders![0],
            '.shadow/UnitTests/unit_test_plan.json'
        );

        this.fileWatcher = vscode.workspace.createFileSystemWatcher(watchPattern);
        this.fileWatcher.onDidChange(() => {
            this.loadUnitTestPlan();
            this.refresh();
        });
        this.fileWatcher.onDidCreate(() => {
            this.loadUnitTestPlan();
            this.refresh();
        });
        this.fileWatcher.onDidDelete(() => {
            this.unitTestPlan = null;
            this.refresh();
        });
    }

    private loadUnitTestPlan(): void {
        if (!this.workspaceRoot) return;

        const unitTestPlanPath = path.join(this.workspaceRoot, '.shadow', 'UnitTests', 'unit_test_plan.json');
        
        if (fs.existsSync(unitTestPlanPath)) {
            try {
                const content = fs.readFileSync(unitTestPlanPath, 'utf-8');
                const parsed = JSON.parse(content);
                
                // Transform old structure to new structure if needed
                if (parsed.unit_test_strategy && !parsed.aggregated_plan) {
                    console.log('[Unit Tests Navigator] Transforming old unit test plan structure...');
                    this.unitTestPlan = {
                        rationale: parsed.rationale,
                        aggregated_plan: {
                            unit_test_plan: parsed.unit_test_strategy ? {
                                strategy: parsed.unit_test_strategy.overall_approach,
                                testing_framework: Array.isArray(parsed.unit_test_strategy.testing_frameworks) 
                                    ? parsed.unit_test_strategy.testing_frameworks[0] 
                                    : parsed.unit_test_strategy.testing_frameworks,
                                mocking_approach: parsed.unit_test_strategy.mocking_strategy,
                                isolation_strategy: parsed.unit_test_strategy.isolation_level
                            } : undefined,
                            test_suites: parsed.test_suites || [],
                            read_write_test_suites: [],
                            user_workflow_test_suites: []
                        }
                    };
                    
                    // Save the transformed structure back to disk
                    try {
                        fs.writeFileSync(unitTestPlanPath, JSON.stringify(this.unitTestPlan, null, 2), 'utf-8');
                        console.log('[Unit Tests Navigator] Saved transformed structure to disk');
                    } catch (writeError) {
                        console.error('Error saving transformed unit test plan:', writeError);
                    }
                } else {
                    this.unitTestPlan = parsed;
                }
            } catch (error) {
                console.error('Error loading unit test plan:', error);
                this.unitTestPlan = null;
            }
        } else {
            this.unitTestPlan = null;
        }
    }

    setUnitTestPlan(plan: UnitTestPlan | null): void {
        this.unitTestPlan = plan;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: UnitTestItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: UnitTestItem): Thenable<UnitTestItem[]> {
        if (!this.unitTestPlan || !this.unitTestPlan.aggregated_plan) {
            return Promise.resolve([
                new UnitTestItem(
                    'No unit test plan yet',
                    vscode.TreeItemCollapsibleState.None,
                    'empty',
                    'Run unit test generation to create unit tests'
                )
            ]);
        }

        if (!element) {
            return Promise.resolve(this.getRootItems());
        }

        return Promise.resolve(this.getChildrenForElement(element));
    }

    private getRootItems(): UnitTestItem[] {
        const items: UnitTestItem[] = [];
        const plan = this.unitTestPlan!.aggregated_plan!;

        // Unit Test Strategy
        if (plan.unit_test_plan) {
            const strategy = plan.unit_test_plan;
            if (strategy.strategy || strategy.testing_framework) {
                items.push(new UnitTestItem(
                    '📋 Unit Test Strategy',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'strategy',
                    strategy.testing_framework || 'Strategy'
                ));
            }
        }

        // Test Suites
        if (plan.test_suites && plan.test_suites.length > 0) {
            items.push(new UnitTestItem(
                `🧪 Test Suites (${plan.test_suites.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'test-suites',
                'Unit test suites'
            ));
        }

        // Read/Write Test Suites
        if (plan.read_write_test_suites && plan.read_write_test_suites.length > 0) {
            items.push(new UnitTestItem(
                `📝 Read/Write Tests (${plan.read_write_test_suites.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'read-write-suites',
                'File operation tests'
            ));
        }

        // User Workflow Test Suites
        if (plan.user_workflow_test_suites && plan.user_workflow_test_suites.length > 0) {
            items.push(new UnitTestItem(
                `🔄 User Workflow Tests (${plan.user_workflow_test_suites.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'workflow-suites',
                'User workflow unit tests'
            ));
        }

        if (items.length === 0) {
            items.push(new UnitTestItem(
                'No test suites defined',
                vscode.TreeItemCollapsibleState.None,
                'empty',
                'Unit test plan exists but no suites defined'
            ));
        }

        return items;
    }

    private getChildrenForElement(element: UnitTestItem): UnitTestItem[] {
        const plan = this.unitTestPlan!.aggregated_plan!;

        switch (element.type) {
            case 'strategy':
                const strategy = plan.unit_test_plan || {};
                const strategyItems: UnitTestItem[] = [];
                if (strategy.strategy) {
                    strategyItems.push(new UnitTestItem('Strategy', vscode.TreeItemCollapsibleState.None, 'text', strategy.strategy));
                }
                if (strategy.testing_framework) {
                    strategyItems.push(new UnitTestItem('Framework', vscode.TreeItemCollapsibleState.None, 'text', strategy.testing_framework));
                }
                if (strategy.mocking_approach) {
                    strategyItems.push(new UnitTestItem('Mocking Approach', vscode.TreeItemCollapsibleState.None, 'text', strategy.mocking_approach));
                }
                if (strategy.isolation_strategy) {
                    strategyItems.push(new UnitTestItem('Isolation Strategy', vscode.TreeItemCollapsibleState.None, 'text', strategy.isolation_strategy));
                }
                return strategyItems;

            case 'test-suites':
                return (plan.test_suites || []).map(suite => new UnitTestItem(
                    suite.name || `Suite ${suite.id}`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'suite',
                    suite.description,
                    suite
                ));

            case 'read-write-suites':
                return (plan.read_write_test_suites || []).map(suite => new UnitTestItem(
                    suite.name || `Read/Write Suite ${suite.id}`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'suite',
                    suite.description || 'File operation tests',
                    suite
                ));

            case 'workflow-suites':
                return (plan.user_workflow_test_suites || []).map(suite => new UnitTestItem(
                    suite.name || `Workflow Suite ${suite.id}`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'suite',
                    suite.description || 'User workflow tests',
                    suite
                ));

            case 'suite':
                const suite = element.data;
                const suiteItems: UnitTestItem[] = [];
                
                if (suite.description) {
                    suiteItems.push(new UnitTestItem('Description', vscode.TreeItemCollapsibleState.None, 'text', suite.description));
                }
                
                if (suite.test_file_path) {
                    const fileItem = new UnitTestItem(
                        `📄 ${path.basename(suite.test_file_path)}`,
                        vscode.TreeItemCollapsibleState.None,
                        'file',
                        suite.test_file_path
                    );
                    if (this.workspaceRoot) {
                        const fullPath = path.join(this.workspaceRoot, suite.test_file_path);
                        if (fs.existsSync(fullPath)) {
                            fileItem.command = {
                                command: 'vscode.open',
                                title: 'Open File',
                                arguments: [vscode.Uri.file(fullPath)]
                            };
                            fileItem.resourceUri = vscode.Uri.file(fullPath);
                        }
                    }
                    suiteItems.push(fileItem);
                }

                if (suite.test_cases && suite.test_cases.length > 0) {
                    suiteItems.push(new UnitTestItem(
                        `Test Cases (${suite.test_cases.length})`,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'test-cases',
                        '',
                        suite.test_cases
                    ));
                }

                return suiteItems;

            case 'test-cases':
                const testCases = element.data || [];
                return testCases.map((testCase: any) => new UnitTestItem(
                    testCase.name || testCase.id,
                    vscode.TreeItemCollapsibleState.None,
                    'test-case',
                    testCase.description || '',
                    testCase
                ));

            default:
                return [];
        }
    }

    dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
    }
}

export class UnitTestItem extends vscode.TreeItem {
    data?: any;

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: string,
        description?: string,
        data?: any
    ) {
        super(label, collapsibleState);
        this.description = description;
        this.data = data;
        this.contextValue = type;

        // Set icon based on type
        switch (type) {
            case 'strategy':
                this.iconPath = new vscode.ThemeIcon('settings-gear');
                break;
            case 'test-suites':
            case 'read-write-suites':
            case 'workflow-suites':
                this.iconPath = new vscode.ThemeIcon('package');
                break;
            case 'suite':
                this.iconPath = new vscode.ThemeIcon('beaker');
                break;
            case 'test-case':
                this.iconPath = new vscode.ThemeIcon('symbol-method');
                break;
            case 'file':
                this.iconPath = new vscode.ThemeIcon('file-code');
                break;
            case 'empty':
                this.iconPath = new vscode.ThemeIcon('info');
                break;
        }

        // Set command for items that should show details when clicked
        if (type === 'suite' || type === 'test-case' || type === 'text' || type === 'strategy') {
            this.command = {
                command: 'shadowWatch.showUnitTestItemDetails',
                title: 'Show Details',
                arguments: [this]
            };
        }
    }
}

