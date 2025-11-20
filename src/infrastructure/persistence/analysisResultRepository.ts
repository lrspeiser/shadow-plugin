/**
 * Analysis Result Repository
 * Handles persistence of analysis results (product docs, insights, summaries)
 * Extracted from llmIntegration.ts to separate persistence concerns
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { EnhancedProductDocumentation } from '../../fileDocumentation';
import { LLMInsights } from '../../llmService';
import { DocumentationFormatter } from '../../domain/formatters/documentationFormatter';
import { createTimestampedStorage } from '../../storage/incrementalStorage';

interface RunContext {
    runId: string;
    runDir: string;
    startTime: Date;
}

export class AnalysisResultRepository {
    private productDocsRun: RunContext | null = null;
    private architectureInsightsRun: RunContext | null = null;
    private formatter: DocumentationFormatter;

    constructor() {
        this.formatter = new DocumentationFormatter();
    }

    /**
     * Initialize a new product docs run
     */
    initializeProductDocsRun(workspaceRoot: string): string {
        if (!this.productDocsRun) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const runId = `product-docs-${timestamp}`;
            const shadowDir = path.join(workspaceRoot, '.shadow');
            const docsDir = path.join(shadowDir, 'docs');
            const runDir = path.join(docsDir, runId);
            
            this.productDocsRun = {
                runId,
                runDir,
                startTime: new Date()
            };
            
            // Create directory structure
            if (!fs.existsSync(runDir)) {
                fs.mkdirSync(runDir, { recursive: true });
            }
        }
        return this.productDocsRun.runDir;
    }

    /**
     * Initialize a new architecture insights run
     */
    initializeArchitectureInsightsRun(workspaceRoot: string): string {
        if (!this.architectureInsightsRun) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const runId = `architecture-insights-${timestamp}`;
            const shadowDir = path.join(workspaceRoot, '.shadow');
            const docsDir = path.join(shadowDir, 'docs');
            const runDir = path.join(docsDir, runId);
            
            this.architectureInsightsRun = {
                runId,
                runDir,
                startTime: new Date()
            };
            
            // Create directory structure
            if (!fs.existsSync(runDir)) {
                fs.mkdirSync(runDir, { recursive: true });
            }
        }
        return this.architectureInsightsRun.runDir;
    }

    /**
     * Save incremental file summary
     */
    saveIncrementalFileSummary(
        fileSummary: any,
        workspaceRoot: string,
        index: number,
        total: number
    ): void {
        try {
            const runDir = this.initializeProductDocsRun(workspaceRoot);
            const filePath = path.join(
                runDir,
                `file-summaries`,
                `${String(index).padStart(4, '0')}-${path.basename(fileSummary.file).replace(/[^a-zA-Z0-9.-]/g, '_')}.json`
            );
            
            // Create subdirectory if needed
            const fileSummariesDir = path.dirname(filePath);
            if (!fs.existsSync(fileSummariesDir)) {
                fs.mkdirSync(fileSummariesDir, { recursive: true });
            }
            
            const summaryWithMetadata = {
                ...fileSummary,
                _metadata: {
                    index,
                    total,
                    savedAt: new Date().toISOString()
                }
            };
            fs.writeFileSync(filePath, JSON.stringify(summaryWithMetadata, null, 2), 'utf-8');
            
            // Also update aggregate file
            this.updateFileSummariesAggregate(runDir, fileSummary, index, total);
        } catch (error) {
            console.error('Failed to save incremental file summary:', error);
        }
    }

    /**
     * Update file summaries aggregate
     */
    private updateFileSummariesAggregate(
        runDir: string,
        fileSummary: any,
        index: number,
        total: number
    ): void {
        try {
            const aggregatePath = path.join(runDir, 'file-summaries.json');
            let summaries: any[] = [];
            
            if (fs.existsSync(aggregatePath)) {
                const content = fs.readFileSync(aggregatePath, 'utf-8');
                summaries = JSON.parse(content);
            }
            
            // Update or add this summary
            const existingIndex = summaries.findIndex(s => s.file === fileSummary.file);
            if (existingIndex >= 0) {
                summaries[existingIndex] = fileSummary;
            } else {
                summaries.push(fileSummary);
            }
            
            // Add metadata
            const aggregate = {
                summaries,
                _metadata: {
                    totalFiles: total,
                    completedFiles: summaries.length,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            fs.writeFileSync(aggregatePath, JSON.stringify(aggregate, null, 2), 'utf-8');
        } catch (error) {
            console.error('Failed to update file summaries aggregate:', error);
        }
    }

    /**
     * Save incremental module summary
     */
    saveIncrementalModuleSummary(
        moduleSummary: any,
        workspaceRoot: string,
        index: number,
        total: number
    ): void {
        try {
            const runDir = this.initializeProductDocsRun(workspaceRoot);
            const modulePath = path.join(
                runDir,
                `module-summaries`,
                `${String(index).padStart(4, '0')}-${path.basename(moduleSummary.module).replace(/[^a-zA-Z0-9.-]/g, '_')}.json`
            );
            
            // Create subdirectory if needed
            const moduleSummariesDir = path.dirname(modulePath);
            if (!fs.existsSync(moduleSummariesDir)) {
                fs.mkdirSync(moduleSummariesDir, { recursive: true });
            }
            
            const summaryWithMetadata = {
                ...moduleSummary,
                _metadata: {
                    index,
                    total,
                    savedAt: new Date().toISOString()
                }
            };
            fs.writeFileSync(modulePath, JSON.stringify(summaryWithMetadata, null, 2), 'utf-8');
            
            // Also update aggregate file
            this.updateModuleSummariesAggregate(runDir, moduleSummary, index, total);
        } catch (error) {
            console.error('Failed to save incremental module summary:', error);
        }
    }

    /**
     * Update module summaries aggregate
     */
    private updateModuleSummariesAggregate(
        runDir: string,
        moduleSummary: any,
        index: number,
        total: number
    ): void {
        try {
            const aggregatePath = path.join(runDir, 'module-summaries.json');
            let summaries: any[] = [];
            
            if (fs.existsSync(aggregatePath)) {
                const content = fs.readFileSync(aggregatePath, 'utf-8');
                summaries = JSON.parse(content);
            }
            
            // Update or add this summary
            const existingIndex = summaries.findIndex(s => s.module === moduleSummary.module);
            if (existingIndex >= 0) {
                summaries[existingIndex] = moduleSummary;
            } else {
                summaries.push(moduleSummary);
            }
            
            // Add metadata
            const aggregate = {
                summaries,
                _metadata: {
                    totalModules: total,
                    completedModules: summaries.length,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            fs.writeFileSync(aggregatePath, JSON.stringify(aggregate, null, 2), 'utf-8');
        } catch (error) {
            console.error('Failed to update module summaries aggregate:', error);
        }
    }


    /**
     * Save final enhanced product docs
     */
    async saveEnhancedProductDocs(
        docs: EnhancedProductDocumentation,
        workspaceRoot: string
    ): Promise<void> {
        const shadowDir = path.join(workspaceRoot, '.shadow');
        const docsDir = path.join(shadowDir, 'docs');

        try {
            if (!fs.existsSync(shadowDir)) {
                fs.mkdirSync(shadowDir, { recursive: true });
            }
            if (!fs.existsSync(docsDir)) {
                fs.mkdirSync(docsDir, { recursive: true });
            }

            // Save final version in run directory
            const runDir = this.productDocsRun?.runDir;
            if (!runDir) {
                throw new Error('No run directory available for saving product docs');
            }
            
            // Save as markdown
            const markdownPath = path.join(runDir, 'enhanced-product-documentation.md');
            const markdown = this.formatter.formatEnhancedDocsAsMarkdown(docs);
            fs.writeFileSync(markdownPath, markdown, 'utf-8');

            // Also save raw JSON with timestamp metadata
            const jsonPath = path.join(runDir, 'enhanced-product-documentation.json');
            const docsWithMetadata = {
                ...docs,
                _metadata: {
                    generatedAt: new Date().toISOString(),
                    generatedAtLocal: new Date().toLocaleString(),
                    runId: this.productDocsRun?.runId
                }
            };
            fs.writeFileSync(jsonPath, JSON.stringify(docsWithMetadata, null, 2), 'utf-8');
            
            // Reset run context
            this.productDocsRun = null;
        } catch (error) {
            console.error('Failed to save enhanced documentation:', error);
            vscode.window.showWarningMessage(`Failed to save enhanced documentation: ${error}`);
        }
    }



    /**
     * Save final architecture insights
     */
    async saveArchitectureInsights(insights: LLMInsights): Promise<void> {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const shadowDir = path.join(workspaceRoot, '.shadow');
        const docsDir = path.join(shadowDir, 'docs');

        try {
            // Create .shadow/docs directory if it doesn't exist
            if (!fs.existsSync(shadowDir)) {
                fs.mkdirSync(shadowDir, { recursive: true });
            }
            if (!fs.existsSync(docsDir)) {
                fs.mkdirSync(docsDir, { recursive: true });
            }

            // Save final version in run directory
            const runDir = this.architectureInsightsRun?.runDir;
            if (!runDir) {
                throw new Error('No run directory available for saving architecture insights');
            }
            
            // Save as markdown
            const markdownPath = path.join(runDir, 'architecture-insights.md');
            const markdown = this.formatter.formatInsightsAsMarkdown(insights);
            fs.writeFileSync(markdownPath, markdown, 'utf-8');

            // Also save raw JSON for programmatic access with timestamp metadata
            const jsonPath = path.join(runDir, 'architecture-insights.json');
            const insightsWithMetadata = {
                ...insights,
                _metadata: {
                    generatedAt: new Date().toISOString(),
                    generatedAtLocal: new Date().toLocaleString(),
                    runId: this.architectureInsightsRun?.runId
                }
            };
            fs.writeFileSync(jsonPath, JSON.stringify(insightsWithMetadata, null, 2), 'utf-8');
            
            // Reset run context
            this.architectureInsightsRun = null;
        } catch (error) {
            console.error('Failed to save architecture insights:', error);
            vscode.window.showWarningMessage(`Failed to save architecture insights: ${error}`);
        }
    }

    /**
     * Reset product docs run (for new generation)
     */
    resetProductDocsRun(): void {
        this.productDocsRun = null;
    }

    /**
     * Reset architecture insights run (for new generation)
     */
    resetArchitectureInsightsRun(): void {
        this.architectureInsightsRun = null;
    }
}

