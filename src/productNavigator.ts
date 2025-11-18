/**
 * Product Navigator - Browse codebase from a product functionality perspective
 * Replaces static file explorer with product-centric navigation
 */
import * as vscode from 'vscode';
import { EnhancedProductDocumentation, FileSummary, ModuleSummary } from './fileDocumentation';
import * as path from 'path';
import * as fs from 'fs';
import { FileWatcherService } from './domain/services/fileWatcherService';

export class ProductNavigatorProvider implements vscode.TreeDataProvider<ProductNavItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ProductNavItem | undefined | null | void> = 
        new vscode.EventEmitter<ProductNavItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ProductNavItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    private productDocs: EnhancedProductDocumentation | null = null;
    private workspaceRoot: string | null = null;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private aggregateWatchers: vscode.FileSystemWatcher[] = [];
    private incrementalFiles: Map<string, any> = new Map(); // Track incremental files
    private fileWatcherService: FileWatcherService | undefined;
    private watcherDisposables: vscode.Disposable[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        fileWatcherService?: FileWatcherService
    ) {
        this.fileWatcherService = fileWatcherService;
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            this.workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            this.setupFileWatcher();
        }
    }

    private setupFileWatcher(): void {
        if (!this.workspaceRoot) return;

        const shadowDir = path.join(this.workspaceRoot, '.shadow');
        const docsDir = path.join(shadowDir, 'docs');
        
        // Create directories if they don't exist
        if (!fs.existsSync(shadowDir)) {
            fs.mkdirSync(shadowDir, { recursive: true });
        }
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }
        
        // Use unified file watcher service if available, otherwise create watchers directly
        if (this.fileWatcherService) {
            // Watch for new files in .shadow/docs and subdirectories
            const pattern = new vscode.RelativePattern(
                vscode.Uri.file(docsDir),
                '**/*.{json,md}'
            );

            this.watcherDisposables.push(
                this.fileWatcherService.watch('productNavigator-docs', pattern, (event) => {
                    if (event.type === 'created') {
                        console.log('[ProductNavigator] New file created in docs:', event.uri.fsPath);
                        this.loadIncrementalFile(event.uri.fsPath);
                        console.log('[ProductNavigator] Refreshing after file create');
                        this.refresh();
                    } else if (event.type === 'changed') {
                        console.log('[ProductNavigator] File changed in docs:', event.uri.fsPath);
                        this.loadIncrementalFile(event.uri.fsPath);
                        console.log('[ProductNavigator] Refreshing after file change');
                        this.refresh();
                    } else if (event.type === 'deleted') {
                        console.log('[ProductNavigator] File deleted in docs:', event.uri.fsPath);
                        this.incrementalFiles.delete(event.uri.fsPath);
                        if (event.uri.fsPath.includes('enhanced-product-documentation.json')) {
                            console.log('[ProductNavigator] Main product docs file deleted, clearing productDocs');
                            this.productDocs = null;
                        }
                        console.log('[ProductNavigator] Refreshing after file delete');
                        this.refresh();
                    }
                })
            );
            
            // Watch for changes to aggregate files
            const aggregatePattern = new vscode.RelativePattern(
                vscode.Uri.file(docsDir),
                '**/module-summaries.json'
            );
            this.watcherDisposables.push(
                this.fileWatcherService.watch('productNavigator-module-summaries', aggregatePattern, (event) => {
                    console.log('[ProductNavigator] Module summaries aggregate file', event.type, ':', event.uri.fsPath);
                    if (event.type === 'deleted') {
                        this.productDocs = null;
                        this.incrementalFiles.clear();
                    }
                    console.log('[ProductNavigator] Refreshing after module summaries', event.type);
                    this.refresh();
                })
            );
            
            const fileSummariesPattern = new vscode.RelativePattern(
                vscode.Uri.file(docsDir),
                '**/file-summaries.json'
            );
            this.watcherDisposables.push(
                this.fileWatcherService.watch('productNavigator-file-summaries', fileSummariesPattern, (event) => {
                    console.log('[ProductNavigator] File summaries aggregate file', event.type, ':', event.uri.fsPath);
                    if (event.type === 'deleted') {
                        this.productDocs = null;
                        this.incrementalFiles.clear();
                    }
                    console.log('[ProductNavigator] Refreshing after file summaries', event.type);
                    this.refresh();
                })
            );
        } else {
            // Fallback: create watchers directly (backward compatibility)
            const pattern = new vscode.RelativePattern(
                vscode.Uri.file(docsDir),
                '**/*.{json,md}'
            );

            this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
            
            this.fileWatcher.onDidCreate((uri) => {
                console.log('[ProductNavigator] New file created in docs:', uri.fsPath);
                this.loadIncrementalFile(uri.fsPath);
                console.log('[ProductNavigator] Refreshing after file create');
                this.refresh();
            });
            
            this.fileWatcher.onDidChange((uri) => {
                console.log('[ProductNavigator] File changed in docs:', uri.fsPath);
                this.loadIncrementalFile(uri.fsPath);
                console.log('[ProductNavigator] Refreshing after file change');
                this.refresh();
            });
            
            this.fileWatcher.onDidDelete((uri) => {
                console.log('[ProductNavigator] File deleted in docs:', uri.fsPath);
                this.incrementalFiles.delete(uri.fsPath);
                if (uri.fsPath.includes('enhanced-product-documentation.json')) {
                    console.log('[ProductNavigator] Main product docs file deleted, clearing productDocs');
                    this.productDocs = null;
                }
                console.log('[ProductNavigator] Refreshing after file delete');
                this.refresh();
            });
            
            // Also watch for changes to aggregate files specifically
            const aggregatePattern = new vscode.RelativePattern(
                vscode.Uri.file(docsDir),
                '**/module-summaries.json'
            );
            const aggregateWatcher = vscode.workspace.createFileSystemWatcher(aggregatePattern);
            aggregateWatcher.onDidChange((uri) => {
                console.log('[ProductNavigator] Module summaries aggregate file changed:', uri.fsPath);
                console.log('[ProductNavigator] Refreshing after module summaries change');
                this.refresh();
            });
            aggregateWatcher.onDidCreate((uri) => {
                console.log('[ProductNavigator] Module summaries aggregate file created:', uri.fsPath);
                console.log('[ProductNavigator] Refreshing after module summaries create');
                this.refresh();
            });
            
            aggregateWatcher.onDidDelete((uri) => {
                console.log('[ProductNavigator] Module summaries aggregate file deleted:', uri.fsPath);
                this.productDocs = null;
                this.incrementalFiles.clear();
                console.log('[ProductNavigator] Refreshing after module summaries delete');
                this.refresh();
            });
            
            // Watch file-summaries.json aggregate too
            const fileSummariesPattern = new vscode.RelativePattern(
                vscode.Uri.file(docsDir),
                '**/file-summaries.json'
            );
            const fileSummariesWatcher = vscode.workspace.createFileSystemWatcher(fileSummariesPattern);
            fileSummariesWatcher.onDidChange((uri) => {
                console.log('[ProductNavigator] File summaries aggregate file changed:', uri.fsPath);
                console.log('[ProductNavigator] Refreshing after file summaries change');
                this.refresh();
            });
            fileSummariesWatcher.onDidCreate((uri) => {
                console.log('[ProductNavigator] File summaries aggregate file created:', uri.fsPath);
                console.log('[ProductNavigator] Refreshing after file summaries create');
                this.refresh();
            });
            
            fileSummariesWatcher.onDidDelete((uri) => {
                console.log('[ProductNavigator] File summaries aggregate file deleted:', uri.fsPath);
                this.productDocs = null;
                this.incrementalFiles.clear();
                console.log('[ProductNavigator] Refreshing after file summaries delete');
                this.refresh();
            });
            
            // Store watchers for disposal
            this.aggregateWatchers.push(aggregateWatcher);
            this.aggregateWatchers.push(fileSummariesWatcher);
        }

        // Load existing incremental files
        this.loadExistingIncrementalFiles();
    }

    private loadIncrementalFile(filePath: string): void {
        try {
            if (!fs.existsSync(filePath)) return;

            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            // Store incremental file
            this.incrementalFiles.set(filePath, {
                path: filePath,
                data: data,
                timestamp: fs.statSync(filePath).mtime
            });
        } catch (error) {
            // Not a JSON file or invalid, skip
            console.log('Skipping non-JSON file or invalid JSON:', filePath);
        }
    }

    private loadExistingIncrementalFiles(): void {
        this.reloadIncrementalFilesFromDisk();
    }

    private reloadIncrementalFilesFromDisk(): void {
        if (!this.workspaceRoot) return;

        // Clear existing incremental files to reload from disk
        this.incrementalFiles.clear();

        const shadowDir = path.join(this.workspaceRoot, '.shadow', 'docs');
        if (!fs.existsSync(shadowDir)) return;

        // Find all run directories
        const entries = fs.readdirSync(shadowDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && (entry.name.startsWith('product-docs-') || entry.name.startsWith('architecture-insights-'))) {
                const runDir = path.join(shadowDir, entry.name);
                this.loadIncrementalFilesFromDir(runDir);
            }
        }
    }

    private loadIncrementalFilesFromDir(dir: string): void {
        try {
            const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
            for (const file of files) {
                if (file.isFile() && file.name.endsWith('.json')) {
                    const filePath = path.join(file.path || dir, file.name);
                    this.loadIncrementalFile(filePath);
                }
            }
        } catch (error) {
            console.error('Error loading incremental files from directory:', error);
        }
    }

    dispose(): void {
        // Dispose unified service watchers
        for (const disposable of this.watcherDisposables) {
            disposable.dispose();
        }
        this.watcherDisposables = [];
        
        // Dispose legacy watchers (if using fallback)
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = undefined;
        }
        for (const watcher of this.aggregateWatchers) {
            watcher.dispose();
        }
        this.aggregateWatchers = [];
    }

    setProductDocs(docs: EnhancedProductDocumentation | null): void {
        this.productDocs = docs;
        this.refresh();
    }

    clearState(): void {
        console.log('[ProductNavigator] clearState() called - clearing productDocs and incrementalFiles');
        this.productDocs = null;
        this.incrementalFiles.clear();
        this.refresh();
    }

    refresh(): void {
        console.log('[ProductNavigator] refresh() called - firing tree data change event');
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ProductNavItem): vscode.TreeItem {
        // Add command to show details for items that have content
        if (element.type === 'overview' || element.type === 'architecture' || 
            element.type === 'text' || element.type === 'feature' ||
            element.type === 'module' || element.type === 'file') {
            if (!element.command) {
                element.command = {
                    command: 'shadowWatch.showProductItemDetails',
                    title: 'Show Details',
                    arguments: [element]
                };
            }
        }
        return element;
    }

    getChildren(element?: ProductNavItem): Thenable<ProductNavItem[]> {
        console.log('[ProductNavigator] getChildren called, element type:', element?.type || 'root');
        console.log('[ProductNavigator] Has productDocs:', !!this.productDocs);
        
        // Only build partial docs from incremental files if we don't have complete docs yet
        // This matches the behavior of InsightsViewerProvider which only loads from disk if !this.insights
        let partialDocs: EnhancedProductDocumentation | null = null;
        if (!this.productDocs) {
            partialDocs = this.buildPartialDocsFromIncremental();
            console.log('[ProductNavigator] Built partial docs:', {
                hasPartialDocs: !!partialDocs,
                modulesCount: partialDocs?.modules?.length || 0,
                fileSummariesCount: partialDocs?.fileSummaries?.length || 0
            });
        }
        
        const docs = this.productDocs || partialDocs;
        
        if (!docs) {
            console.log('[ProductNavigator] No docs available, showing placeholder');
            return Promise.resolve([
                new ProductNavItem(
                    'No product documentation yet',
                    vscode.TreeItemCollapsibleState.None,
                    'info',
                    'Run "Generate Product Documentation" to create product navigation'
                )
            ]);
        }
        
        console.log('[ProductNavigator] Using docs:', {
            hasOverview: !!docs.overview,
            modulesCount: docs.modules?.length || 0,
            fileSummariesCount: docs.fileSummaries?.length || 0
        });

        if (!element) {
            // Root level - show product overview and modules
            // Temporarily set productDocs so getRootItems() can use it
            const originalDocs = this.productDocs;
            this.productDocs = docs as EnhancedProductDocumentation;
            const items = this.getRootItems();
            this.productDocs = originalDocs;
            return Promise.resolve(items);
        }

        // Handle different item types
        switch (element.type) {
            case 'overview':
                return Promise.resolve(this.getOverviewItems());
            case 'what-it-does':
                return Promise.resolve(this.getWhatItDoesItems());
            case 'user-perspective':
                return Promise.resolve(this.getUserPerspectiveCategories());
            case 'user-perspective-gui':
            case 'user-perspective-cli':
            case 'user-perspective-api':
            case 'user-perspective-cicd':
                return Promise.resolve(this.getUserPerspectiveItemsByType(element.type.split('-')[2] as 'gui' | 'cli' | 'api' | 'cicd'));
            case 'workflow':
                return Promise.resolve(this.getWorkflowItems());
            case 'problems':
                return Promise.resolve(this.getProblemsItems());
            case 'module-type':
                return Promise.resolve(this.getModuleTypeItems(element));
            case 'module':
                return Promise.resolve(this.getModuleItems(element));
            case 'module-capability':
                return Promise.resolve(this.getCapabilityFiles(element));
            case 'module-files':
                return Promise.resolve(this.getModuleFilesItems(element));
            case 'files-root':
                return Promise.resolve(this.getRootFilesItems(element));
            case 'file':
                return Promise.resolve(this.getFileItems(element));
            case 'user-actions':
                return Promise.resolve(this.getUserActionsItems(element));
            case 'function':
                return Promise.resolve([]); // Functions are leaf nodes
            default:
                return Promise.resolve([]);
        }
    }

    private buildPartialDocsFromIncremental(): EnhancedProductDocumentation | null {
        console.log('[ProductNavigator] buildPartialDocsFromIncremental() called');
        
        // Always reload from disk to ensure we have the latest data
        // This prevents showing stale data after files are deleted
        this.reloadIncrementalFilesFromDisk();
        
        // Check for module-summaries.json aggregate file
        if (!this.workspaceRoot) {
            console.log('[ProductNavigator] No workspace root');
            return null;
        }
        
        const shadowDir = path.join(this.workspaceRoot, '.shadow', 'docs');
        console.log('[ProductNavigator] Checking shadow dir:', shadowDir);
        
        if (!fs.existsSync(shadowDir)) {
            console.log('[ProductNavigator] Shadow dir does not exist');
            return null;
        }
        
        // Find the latest product-docs run directory
        const entries = fs.readdirSync(shadowDir, { withFileTypes: true });
        console.log('[ProductNavigator] Found entries in shadow dir:', entries.map(e => e.name));
        
        const productDocRuns = entries
            .filter(e => e.isDirectory() && e.name.startsWith('product-docs-'))
            .map(e => ({
                name: e.name,
                path: path.join(shadowDir, e.name),
                mtime: fs.statSync(path.join(shadowDir, e.name)).mtimeMs
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        console.log('[ProductNavigator] Found product doc runs:', productDocRuns.map(r => r.name));
        
        if (productDocRuns.length === 0) {
            console.log('[ProductNavigator] No product doc runs found');
            return null;
        }
        
        const latestRun = productDocRuns[0];
        console.log('[ProductNavigator] Using latest run:', latestRun.name, 'at', latestRun.path);
        
        // Load module summaries from aggregate file
        const moduleSummariesPath = path.join(latestRun.path, 'module-summaries.json');
        console.log('[ProductNavigator] Checking for module summaries at:', moduleSummariesPath);
        
        let modules: ModuleSummary[] = [];
        if (fs.existsSync(moduleSummariesPath)) {
            try {
                const content = fs.readFileSync(moduleSummariesPath, 'utf-8');
                const aggregate = JSON.parse(content);
                console.log('[ProductNavigator] Loaded module summaries aggregate:', {
                    hasSummaries: !!aggregate.summaries,
                    summariesIsArray: Array.isArray(aggregate.summaries),
                    summariesLength: aggregate.summaries?.length || 0,
                    metadata: aggregate._metadata
                });
                
                if (aggregate.summaries && Array.isArray(aggregate.summaries)) {
                    modules = aggregate.summaries;
                    console.log('[ProductNavigator] Loaded', modules.length, 'modules:', modules.map(m => m.module));
                }
            } catch (error) {
                console.error('[ProductNavigator] Failed to load module summaries:', error);
            }
        } else {
            console.log('[ProductNavigator] Module summaries file does not exist');
        }
        
        // Load file summaries from aggregate file
        const fileSummariesPath = path.join(latestRun.path, 'file-summaries.json');
        console.log('[ProductNavigator] Checking for file summaries at:', fileSummariesPath);
        
        let fileSummaries: FileSummary[] = [];
        if (fs.existsSync(fileSummariesPath)) {
            try {
                const content = fs.readFileSync(fileSummariesPath, 'utf-8');
                const aggregate = JSON.parse(content);
                console.log('[ProductNavigator] Loaded file summaries aggregate:', {
                    hasSummaries: !!aggregate.summaries,
                    summariesLength: aggregate.summaries?.length || 0,
                    metadata: aggregate._metadata
                });
                
                if (aggregate.summaries && Array.isArray(aggregate.summaries)) {
                    fileSummaries = aggregate.summaries;
                    console.log('[ProductNavigator] Loaded', fileSummaries.length, 'file summaries');
                }
            } catch (error) {
                console.error('[ProductNavigator] Failed to load file summaries:', error);
            }
        } else {
            console.log('[ProductNavigator] File summaries file does not exist');
        }
        
        // Link file summaries to modules if modules don't have files populated
        // This happens when building partial docs during generation
        if (modules.length > 0 && fileSummaries.length > 0) {
            console.log('[ProductNavigator] Linking file summaries to modules...');
            for (const module of modules) {
                if (!module.files || module.files.length === 0) {
                    // Find files that belong to this module by path
                    const moduleFiles = fileSummaries.filter(file => {
                        const filePath = file.file;
                        const modulePath = module.module;
                        // File belongs to module if it starts with module path
                        return filePath.startsWith(modulePath + '/') || filePath.startsWith(modulePath + '\\');
                    });
                    if (moduleFiles.length > 0) {
                        console.log('[ProductNavigator] Linked', moduleFiles.length, 'files to module', module.module);
                        module.files = moduleFiles;
                    }
                }
            }
        }
        
        // Only return partial docs if we have some data
        if (modules.length > 0 || fileSummaries.length > 0) {
            console.log('[ProductNavigator] Returning partial docs with', modules.length, 'modules and', fileSummaries.length, 'file summaries');
            return {
                overview: '',
                whatItDoes: [],
                userPerspective: { gui: [], cli: [], api: [], cicd: [] },
                workflowIntegration: [],
                problemsSolved: [],
                architecture: '',
                modules: modules,
                fileSummaries: fileSummaries
            } as EnhancedProductDocumentation;
        }
        
        console.log('[ProductNavigator] No data found in incremental files, returning null');
        return null;
    }

    private getRootItems(): ProductNavItem[] {
        console.log('[ProductNavigator] getRootItems() called');
        const items: ProductNavItem[] = [];
        const docs = this.productDocs!;
        console.log('[ProductNavigator] getRootItems - docs modules count:', docs.modules?.length || 0);

        // Product Overview
        if (docs.overview) {
            items.push(new ProductNavItem(
                '📖 Product Overview',
                vscode.TreeItemCollapsibleState.Collapsed,
                'overview',
                docs.overview.substring(0, 100) + '...'
            ));
        }

        // What It Does
        if (docs.whatItDoes && docs.whatItDoes.length > 0) {
            items.push(new ProductNavItem(
                `✨ What It Does (${docs.whatItDoes.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'what-it-does',
                'User-facing features'
            ));
        }

        // User Perspective
        const hasUserPerspective = docs.userPerspective && (
            (docs.userPerspective.gui && docs.userPerspective.gui.length > 0) ||
            (docs.userPerspective.cli && docs.userPerspective.cli.length > 0) ||
            (docs.userPerspective.api && docs.userPerspective.api.length > 0) ||
            (docs.userPerspective.cicd && docs.userPerspective.cicd.length > 0)
        );
        if (hasUserPerspective) {
            items.push(new ProductNavItem(
                '👤 User Perspective',
                vscode.TreeItemCollapsibleState.Collapsed,
                'user-perspective',
                'What users see and experience'
            ));
        }

        // Workflow Integration
        if (docs.workflowIntegration && docs.workflowIntegration.length > 0) {
            items.push(new ProductNavItem(
                `🔄 Workflow Integration (${docs.workflowIntegration.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'workflow',
                'How it fits into workflows'
            ));
        }

        // Problems Solved
        if (docs.problemsSolved && docs.problemsSolved.length > 0) {
            items.push(new ProductNavItem(
                `🎯 Problems Solved (${docs.problemsSolved.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'problems',
                'What problems this solves'
            ));
        }

        // Modules organized by type
        if (docs.modules && docs.modules.length > 0) {
            const modulesByType = this.groupModulesByType(docs.modules);
            
            for (const [type, modules] of modulesByType.entries()) {
                // Skip unreliable buckets
                if (type === 'other' || type === 'api' || type === 'cli' || type === 'gui') {
                    continue;
                }
                const typeLabel = this.getModuleTypeLabel(type);
                items.push(new ProductNavItem(
                    `${typeLabel} (${modules.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'module-type',
                    `${modules.length} ${type} modules`,
                    { moduleType: type, modules: modules }
                ));
            }
        }
        
        // Show file summaries at root level if they exist (for partial docs during generation)
        // Files are also shown under modules, but this helps when modules don't have files populated yet
        if (docs.fileSummaries && docs.fileSummaries.length > 0) {
            console.log('[ProductNavigator] getRootItems - adding', docs.fileSummaries.length, 'files to root');
            // Only show if we don't have complete docs (i.e., showing partial docs)
            if (!this.productDocs || !this.productDocs.overview) {
                items.push(new ProductNavItem(
                    `📁 Files (${docs.fileSummaries.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'files-root',
                    `${docs.fileSummaries.length} files analyzed`,
                    { files: docs.fileSummaries }
                ));
            }
        }

        return items;
    }

    private getOverviewItems(): ProductNavItem[] {
        const docs = this.productDocs!;
        // Return single item with full overview content
        return [new ProductNavItem(
            docs.overview || 'No overview available',
            vscode.TreeItemCollapsibleState.None,
            'text',
            'Product overview',
            { content: docs.overview, type: 'overview' }
        )];
    }

    private getWhatItDoesItems(): ProductNavItem[] {
        const docs = this.productDocs!;
        return docs.whatItDoes.map((feature, idx) => 
            new ProductNavItem(
                feature,
                vscode.TreeItemCollapsibleState.None,
                'feature',
                `Feature ${idx + 1}`,
                { content: feature, type: 'feature' }
            )
        );
    }

    private getUserPerspectiveCategories(): ProductNavItem[] {
        const docs = this.productDocs!;
        const items: ProductNavItem[] = [];

        if (docs.userPerspective.gui && docs.userPerspective.gui.length > 0) {
            items.push(new ProductNavItem(
                `🖥️ GUI (${docs.userPerspective.gui.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'user-perspective-gui',
                'What users see in the GUI'
            ));
        }

        if (docs.userPerspective.cli && docs.userPerspective.cli.length > 0) {
            items.push(new ProductNavItem(
                `⌨️ CLI (${docs.userPerspective.cli.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'user-perspective-cli',
                'What commands exist'
            ));
        }

        if (docs.userPerspective.api && docs.userPerspective.api.length > 0) {
            items.push(new ProductNavItem(
                `🔌 API (${docs.userPerspective.api.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'user-perspective-api',
                'What endpoints exist'
            ));
        }

        if (docs.userPerspective.cicd && docs.userPerspective.cicd.length > 0) {
            items.push(new ProductNavItem(
                `🚀 CI/CD (${docs.userPerspective.cicd.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'user-perspective-cicd',
                'CI/CD integration'
            ));
        }

        return items;
    }

    private getUserPerspectiveItemsByType(type: 'gui' | 'cli' | 'api' | 'cicd'): ProductNavItem[] {
        const docs = this.productDocs!;
        const items = docs.userPerspective?.[type] || [];
        return items.map((item, idx) => 
            new ProductNavItem(
                item,
                vscode.TreeItemCollapsibleState.None,
                'text',
                `${type.toUpperCase()} item ${idx + 1}`,
                { content: item, type: `user-perspective-${type}` }
            )
        );
    }

    private getModuleTypeItems(element: ProductNavItem): ProductNavItem[] {
        const modules = element.data?.modules as ModuleSummary[];
        if (!modules) return [];

        return modules.map(module => 
            new ProductNavItem(
                path.basename(module.module) || module.module,
                vscode.TreeItemCollapsibleState.Collapsed,
                'module',
                module.summary || 'Module',
                { module: module }
            )
        );
    }

    private getRootFilesItems(element: ProductNavItem): ProductNavItem[] {
        const files = element.data?.files as FileSummary[];
        console.log('[ProductNavigator] getRootFilesItems - files count:', files?.length || 0);
        if (!files || files.length === 0) return [];

        return files.map(file => 
            new ProductNavItem(
                path.basename(file.file) || file.file,
                vscode.TreeItemCollapsibleState.Collapsed,
                'file',
                file.purpose || file.role || 'File',
                { file: file }
            )
        );
    }

    private getModuleFilesItems(element: ProductNavItem): ProductNavItem[] {
        const module = element.data?.module as ModuleSummary;
        if (!module || !module.files) return [];

        return module.files.map(file => 
            new ProductNavItem(
                path.basename(file.file),
                vscode.TreeItemCollapsibleState.Collapsed,
                'file',
                file.purpose,
                { file: file }
            )
        );
    }

    private getUserActionsItems(element: ProductNavItem): ProductNavItem[] {
        const file = element.data?.file as FileSummary;
        if (!file || !file.userVisibleActions) return [];

        return file.userVisibleActions.map((action, idx) => 
            new ProductNavItem(
                action,
                vscode.TreeItemCollapsibleState.None,
                'text',
                `User action ${idx + 1}`,
                { content: action, type: 'user-action' }
            )
        );
    }

    private getWorkflowItems(): ProductNavItem[] {
        const docs = this.productDocs!;
        return docs.workflowIntegration.map((workflow, idx) => 
            new ProductNavItem(
                workflow,
                vscode.TreeItemCollapsibleState.None,
                'text',
                `Workflow ${idx + 1}`,
                { content: workflow, type: 'workflow' }
            )
        );
    }

    private getProblemsItems(): ProductNavItem[] {
        const docs = this.productDocs!;
        return docs.problemsSolved.map((problem, idx) => 
            new ProductNavItem(
                problem,
                vscode.TreeItemCollapsibleState.None,
                'text',
                `Problem ${idx + 1}`,
                { content: problem, type: 'problem' }
            )
        );
    }

    private getModuleItems(element: ProductNavItem): ProductNavItem[] {
        const module = element.data?.module as ModuleSummary;
        if (!module) return [];

        const items: ProductNavItem[] = [];

        // Module summary
        if (module.summary) {
            items.push(new ProductNavItem(
                '📝 Summary',
                vscode.TreeItemCollapsibleState.None,
                'text',
                module.summary.substring(0, 150) + (module.summary.length > 150 ? '...' : ''),
                { content: module.summary, type: 'module-summary' }
            ));
        }

        // Capabilities
        if (module.capabilities && module.capabilities.length > 0) {
            for (const capability of module.capabilities) {
                items.push(new ProductNavItem(
                    capability,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'module-capability',
                    'Click to see files',
                    { module: module, capability: capability }
                ));
            }
        }

        // Endpoints (for API modules)
        if (module.endpoints && module.endpoints.length > 0) {
            for (const endpoint of module.endpoints) {
                const label = endpoint.method 
                    ? `${endpoint.method} ${endpoint.path}`
                    : endpoint.path;
                items.push(new ProductNavItem(
                    label,
                    vscode.TreeItemCollapsibleState.None,
                    'endpoint',
                    endpoint.description,
                    { endpoint: endpoint, module: module }
                ));
            }
        }

        // Commands (for CLI modules)
        if (module.commands && module.commands.length > 0) {
            for (const command of module.commands) {
                items.push(new ProductNavItem(
                    command.command,
                    vscode.TreeItemCollapsibleState.None,
                    'command',
                    command.description,
                    { command: command, module: module }
                ));
            }
        }

        // Workers (for worker modules)
        if (module.workers && module.workers.length > 0) {
            for (const worker of module.workers) {
                items.push(new ProductNavItem(
                    worker.name,
                    vscode.TreeItemCollapsibleState.None,
                    'worker',
                    worker.description,
                    { worker: worker, module: module }
                ));
            }
        }

        // Files in this module
        if (module.files && module.files.length > 0) {
            items.push(new ProductNavItem(
                `📁 Files (${module.files.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'module-files',
                'Files in this module',
                { module: module }
            ));
        }

        return items;
    }

    private getCapabilityFiles(element: ProductNavItem): ProductNavItem[] {
        const module = element.data?.module as ModuleSummary;
        const capability = element.data?.capability as string;
        if (!module || !capability) return [];

        // Find files that relate to this capability
        const relevantFiles = module.files.filter(f => 
            f.userVisibleActions.some(action => 
                action.toLowerCase().includes(capability.toLowerCase())
            ) || 
            f.purpose.toLowerCase().includes(capability.toLowerCase())
        );

        return relevantFiles.map(file => 
            new ProductNavItem(
                path.basename(file.file),
                vscode.TreeItemCollapsibleState.Collapsed,
                'file',
                file.purpose,
                { file: file }
            )
        );
    }

    private getFileItems(element: ProductNavItem): ProductNavItem[] {
        const file = element.data?.file as FileSummary;
        if (!file) return [];

        const items: ProductNavItem[] = [];

        // File purpose
        if (file.purpose) {
            items.push(new ProductNavItem(
                '📝 Purpose',
                vscode.TreeItemCollapsibleState.None,
                'text',
                file.purpose,
                { content: file.purpose, type: 'file-purpose' }
            ));
        }

        // User visible actions
        if (file.userVisibleActions && file.userVisibleActions.length > 0) {
            items.push(new ProductNavItem(
                `👤 User Actions (${file.userVisibleActions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'user-actions',
                'What users see',
                { file: file }
            ));
        }

        // Key functions
        if (file.keyFunctions && file.keyFunctions.length > 0) {
            for (const func of file.keyFunctions) {
                items.push(new ProductNavItem(
                    `⚙️ ${func.name}`,
                    vscode.TreeItemCollapsibleState.None,
                    'function',
                    func.desc,
                    { file: file, function: func }
                ));
            }
        }

        // Navigate to file
        items.push(new ProductNavItem(
            '🔗 Open File',
            vscode.TreeItemCollapsibleState.None,
            'navigate',
            `Open ${file.file}`,
            { file: file, action: 'open' }
        ));

        return items;
    }

    private groupModulesByType(modules: ModuleSummary[]): Map<string, ModuleSummary[]> {
        const grouped = new Map<string, ModuleSummary[]>();
        
        for (const module of modules) {
            const type = module.moduleType || 'other';
            if (!grouped.has(type)) {
                grouped.set(type, []);
            }
            grouped.get(type)!.push(module);
        }

        return grouped;
    }

    private getModuleTypeLabel(type: string): string {
        const labels: { [key: string]: string } = {
            'api': '🔌 API Modules',
            'cli': '⌨️ CLI Modules',
            'workers': '⚙️ Worker Modules',
            'core': '🧠 Core Modules',
            'gui': '🖥️ GUI Modules',
            'tests': '🧪 Test Modules',
            'other': '📦 Other Modules'
        };
        return labels[type] || `📦 ${type} Modules`;
    }
}

export class ProductNavItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: string,
        public readonly description?: string,
        public readonly data?: any
    ) {
        super(label, collapsibleState);

        this.description = description;
        this.tooltip = description || label;

        // Set icons based on type
        this.iconPath = this.getIconForType(type);

        // Set command for navigable items
        if (this.isNavigable()) {
            this.command = {
                command: 'shadowWatch.navigateToProductItem',
                title: 'Navigate',
                arguments: [this]
            };
        }
    }

    private getIconForType(type: string): vscode.ThemeIcon {
        const iconMap: { [key: string]: string } = {
            'overview': 'book',
            'what-it-does': 'sparkle',
            'user-perspective': 'person',
            'workflow': 'sync',
            'problems': 'target',
            'module': 'folder',
            'module-type': 'folder-opened',
            'module-capability': 'lightbulb',
            'file': 'file',
            'function': 'symbol-function',
            'endpoint': 'globe',
            'command': 'terminal',
            'worker': 'tools',
            'feature': 'star',
            'workflow-item': 'arrow-right',
            'problem': 'warning',
            'navigate': 'link-external',
            'text': 'text',
            'info': 'info',
            'user-actions': 'person',
            'module-files': 'files'
        };

        return new vscode.ThemeIcon(iconMap[type] || 'circle-outline');
    }

    private isNavigable(): boolean {
        return this.type === 'file' || 
               this.type === 'function' || 
               this.type === 'endpoint' || 
               this.type === 'command' ||
               this.type === 'worker' ||
               this.type === 'navigate';
    }
}

