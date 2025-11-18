/**
 * Integration functions for LLM-powered features
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LLMService, AnalysisContext, LLMInsights } from './llmService';
import { InsightsTreeProvider } from './insightsTreeView';
import { EnhancedProductDocumentation } from './fileDocumentation';
import { CodeAnalysis, EntryPoint } from './analyzer';
import { ProductNavigatorProvider } from './productNavigator';
import { AnalysisViewerProvider } from './analysisViewer';
import { InsightsViewerProvider } from './insightsViewer';
import { UnitTestsNavigatorProvider } from './unitTestsNavigator';
import { SWLogger } from './logger';
import { createTimestampedStorage } from './storage/incrementalStorage';

let llmService: LLMService;
let lastAnalysisContext: AnalysisContext | null = null;
let lastEnhancedProductDocs: EnhancedProductDocumentation | null = null;
let lastLLMInsights: LLMInsights | null = null;
let treeProvider: InsightsTreeProvider | null = null;
let productNavigator: ProductNavigatorProvider | null = null;
let insightsViewer: InsightsViewerProvider | null = null;
let analysisViewer: AnalysisViewerProvider | null = null;
let unitTestsNavigator: UnitTestsNavigatorProvider | null = null;
let outputChannel: vscode.OutputChannel | null = null;
let lastCodeAnalysis: CodeAnalysis | null = null;

export function initializeLLMService() {
    llmService = new LLMService();
    // Create output channel for documentation
    outputChannel = vscode.window.createOutputChannel('Shadow Watch Documentation');
    SWLogger.section('Extension Init');
    
    // Refresh tree view when API key configuration changes
    llmService.setOnConfigurationChange(() => {
        if (treeProvider) {
            treeProvider.refresh();
        }
    });
    
    // Load saved insights, docs, and analysis on startup
    // Note: Analysis status will be restored by treeProvider.checkFileExistence()
    // which is called in the constructor, so we don't need to call loadSavedCodeAnalysis here
    loadSavedInsights();
    loadSavedProductDocs();
    // loadSavedCodeAnalysis() will be called after treeProvider is set up
}

async function loadSavedInsights(): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const docsDir = path.join(workspaceRoot, '.shadow', 'docs');

    if (!fs.existsSync(docsDir)) {
        return;
    }

    // Find the latest architecture insights run directory
    const entries = fs.readdirSync(docsDir, { withFileTypes: true });
    const insightRuns = entries
        .filter(e => e.isDirectory() && e.name.startsWith('architecture-insights-'))
        .map(e => ({
            name: e.name,
            path: path.join(docsDir, e.name),
            mtime: fs.statSync(path.join(docsDir, e.name)).mtimeMs
        }))
        .sort((a, b) => b.mtime - a.mtime); // Sort by most recent first

    if (insightRuns.length > 0) {
        const latestRun = insightRuns[0];
        const insightsPath = path.join(latestRun.path, 'architecture-insights.json');
        if (fs.existsSync(insightsPath)) {
            try {
                const insightsContent = fs.readFileSync(insightsPath, 'utf-8');
                lastLLMInsights = JSON.parse(insightsContent) as LLMInsights;
                console.log(`Loaded architecture insights from latest run: ${latestRun.name}`);
                
                // Update insights viewer if available
                if (insightsViewer) {
                    insightsViewer.setInsights(lastLLMInsights);
                }
            } catch (error) {
                console.error('Failed to load architecture insights from file:', error);
            }
        }
    }
}

async function loadSavedProductDocs(): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const docsDir = path.join(workspaceRoot, '.shadow', 'docs');

    if (!fs.existsSync(docsDir)) {
        return;
    }

    // Find the latest product docs run directory
    const entries = fs.readdirSync(docsDir, { withFileTypes: true });
    const productDocRuns = entries
        .filter(e => e.isDirectory() && e.name.startsWith('product-docs-'))
        .map(e => ({
            name: e.name,
            path: path.join(docsDir, e.name),
            mtime: fs.statSync(path.join(docsDir, e.name)).mtimeMs
        }))
        .sort((a, b) => b.mtime - a.mtime); // Sort by most recent first

    if (productDocRuns.length > 0) {
        const latestRun = productDocRuns[0];
        const docsPath = path.join(latestRun.path, 'enhanced-product-documentation.json');
        if (fs.existsSync(docsPath)) {
            try {
                const docsContent = fs.readFileSync(docsPath, 'utf-8');
                lastEnhancedProductDocs = JSON.parse(docsContent) as EnhancedProductDocumentation;
                console.log(`✅ Loaded enhanced product documentation from latest run: ${latestRun.name}`);
                console.log(`   Path: ${docsPath}`);
                SWLogger.log(`Loaded product docs from ${docsPath}`);
                
                // Update product navigator if available (might be set later)
                if (productNavigator) {
                    productNavigator.setProductDocs(lastEnhancedProductDocs);
                }
                
                // Update tree provider status if available (might be set later)
                if (treeProvider) {
                    treeProvider.setProductDocsStatus('complete');
                }
            } catch (error) {
                console.error('Failed to load enhanced product documentation from file:', error);
                console.error(`   Attempted path: ${docsPath}`);
                SWLogger.log(`ERROR loading product docs: ${(error as any)?.message || error}`);
            }
        } else {
            console.log(`⚠️ Enhanced product documentation file not found in run: ${latestRun.name}`);
            SWLogger.log(`Product docs not found in run ${latestRun.name}`);
        }
    } else {
        console.log(`⚠️ No product documentation runs found in: ${docsDir}`);
        SWLogger.log(`No product docs runs found in ${docsDir}`);
    }
}

export function setTreeProvider(provider: InsightsTreeProvider) {
    treeProvider = provider;
    // Pass LLMService to tree provider so it can check API key status
    provider.setLLMService(llmService);
    // If we already have docs loaded, update the status now that tree provider is available
    if (lastEnhancedProductDocs) {
        treeProvider.setProductDocsStatus('complete');
    }
    // If we already have analysis loaded, update the status now that tree provider is available
    if (lastAnalysisContext) {
        treeProvider.setAnalysisComplete();
    }
}

export function setProductNavigator(provider: ProductNavigatorProvider) {
    productNavigator = provider;
    // If we already have docs loaded, set them now
    if (lastEnhancedProductDocs) {
        productNavigator.setProductDocs(lastEnhancedProductDocs);
    }
}

export function setUnitTestsNavigator(provider: UnitTestsNavigatorProvider) {
    unitTestsNavigator = provider;
}

export function setInsightsViewer(provider: InsightsViewerProvider) {
    insightsViewer = provider;
    // If we already have insights loaded, set them now
    if (lastLLMInsights) {
        insightsViewer.setInsights(lastLLMInsights);
    }
}

export function setAnalysisViewer(provider: AnalysisViewerProvider) {
    analysisViewer = provider;
    // If we already have analysis loaded, set it now
    if (lastCodeAnalysis) {
        analysisViewer.setAnalysis(lastCodeAnalysis);
    }
}

export function setCodeAnalysis(analysis: CodeAnalysis) {
    lastCodeAnalysis = analysis;
    // Convert CodeAnalysis to AnalysisContext and save it
    lastAnalysisContext = convertCodeAnalysisToContext(analysis);
    // Save analysis data for future use
    saveCodeAnalysis(analysis);
}

export function setAnalysisContext(context: AnalysisContext) {
    lastAnalysisContext = context;
}

/**
 * Convert CodeAnalysis to AnalysisContext format
 */
function convertCodeAnalysisToContext(analysis: CodeAnalysis): AnalysisContext {
    return {
        files: analysis.files.map(f => ({
            path: f.path,
            lines: f.lines,
            functions: f.functions,
            language: f.language
        })),
        imports: analysis.imports,
        entryPoints: analysis.entryPoints.map(ep => ({
            path: ep.path,
            type: ep.type,
            reason: ep.reason
        })),
        orphanedFiles: analysis.orphanedFiles,
        importedFiles: analysis.importedFiles,
        totalFiles: analysis.totalFiles,
        totalLines: analysis.totalLines,
        totalFunctions: analysis.totalFunctions,
        largeFiles: analysis.largeFiles
    };
}

/**
 * Save code analysis to file for future use
 */
function saveCodeAnalysis(analysis: CodeAnalysis): void {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const shadowDir = path.join(workspaceRoot, '.shadow');
    const docsDir = path.join(shadowDir, 'docs');

    try {
        if (!fs.existsSync(shadowDir)) {
            fs.mkdirSync(shadowDir, { recursive: true });
        }
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }

        const analysisPath = path.join(docsDir, 'code-analysis.json');
        const analysisWithMetadata = {
            ...analysis,
            _metadata: {
                generatedAt: new Date().toISOString(),
                generatedAtLocal: new Date().toLocaleString()
            }
        };
        fs.writeFileSync(analysisPath, JSON.stringify(analysisWithMetadata, null, 2), 'utf-8');
        console.log('Saved code analysis to file');
    } catch (error) {
        console.error('Failed to save code analysis:', error);
    }
}

/**
 * Load saved code analysis on startup
 */
export async function loadSavedCodeAnalysis(): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const docsDir = path.join(workspaceRoot, '.shadow', 'docs');
    const analysisPath = path.join(docsDir, 'code-analysis.json');

    if (fs.existsSync(analysisPath)) {
        try {
            const analysisContent = fs.readFileSync(analysisPath, 'utf-8');
            const analysis = JSON.parse(analysisContent) as CodeAnalysis;
            lastCodeAnalysis = analysis;
            lastAnalysisContext = convertCodeAnalysisToContext(analysis);
            console.log('✅ Loaded code analysis from file on startup');
            console.log(`   Path: ${analysisPath}`);
            
            // Update tree provider status if available (might be set later)
            if (treeProvider) {
                treeProvider.setAnalysisComplete();
            }
            
            // Update analysis viewer if available (might be set later)
            if (analysisViewer) {
                analysisViewer.setAnalysis(analysis);
            }
        } catch (error) {
            console.error('Failed to load code analysis from file:', error);
            console.error(`   Attempted path: ${analysisPath}`);
        }
    } else {
        console.log(`⚠️ Code analysis file not found at: ${analysisPath}`);
    }
}

export async function copyLLMInsight(type: string, content: string): Promise<void> {
    await vscode.env.clipboard.writeText(content);
    
    const typeLabels: { [key: string]: string } = {
        'overall': 'Overall Assessment',
        'organization': 'Code Organization Analysis',
        'reorganization': 'Folder Reorganization Plan',
        'cursor-prompt': 'LLM Refactoring Prompt',
        'strengths': 'Strength',
        'issues': 'Issue',
        'recommendations': 'Recommendation',
        'priorities': 'Priority'
    };
    
    const label = typeLabels[type] || 'Insight';
    vscode.window.showInformationMessage(`✅ ${label} copied to clipboard!`);
}

export async function setApiKey() {
    const provider = llmService.getProvider();
    const isClaude = provider === 'claude';
    const wasConfigured = llmService.isConfigured();
    const success = await llmService.promptForApiKey();
    if (success) {
        // Refresh tree view to update button label
        if (treeProvider) {
            treeProvider.refresh();
        }
        const providerName = isClaude ? 'Claude' : 'OpenAI';
        const message = wasConfigured 
            ? `✅ ${providerName} API key updated successfully! (Saved globally - persists across restarts)`
            : `✅ ${providerName} API key saved successfully! (Saved globally - persists across restarts)`;
        vscode.window.showInformationMessage(message);
    }
}

export async function setClaudeApiKey() {
    const wasConfigured = llmService.isConfigured();
    const success = await llmService.promptForClaudeApiKey();
    if (success) {
        // Refresh tree view to update button label
        if (treeProvider) {
            treeProvider.refresh();
        }
        const message = wasConfigured 
            ? '✅ Claude API key updated successfully! (Saved globally - persists across restarts)'
            : '✅ Claude API key saved successfully! (Saved globally - persists across restarts)';
        vscode.window.showInformationMessage(message);
    }
}

export async function generateProductDocs() {
    // Prevent duplicate calls
    if (treeProvider && treeProvider.getProductDocsStatus() === 'generating') {
        vscode.window.showWarningMessage('Product documentation generation is already in progress. Please wait...');
        return;
    }

    if (!llmService.isConfigured()) {
        const result = await vscode.window.showWarningMessage(
            'OpenAI API key not configured. Would you like to set it now?',
            'Set API Key',
            'Cancel'
        );
        
        if (result === 'Set API Key') {
            await setApiKey();
            if (!llmService.isConfigured()) {
                return;
            }
        } else {
            return;
        }
    }

    if (!lastAnalysisContext) {
        vscode.window.showErrorMessage('Please run "Analyze Workspace" first');
        return;
    }

    // Update UI to show generating status
    if (treeProvider) {
        treeProvider.setProductDocsStatus('generating');
    }
    SWLogger.section('Generate Product Docs');
    SWLogger.log('Status: generating');

    if (!lastCodeAnalysis) {
        vscode.window.showErrorMessage('Please run "Analyze Workspace" first to get code analysis');
        return;
    }

    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating Enhanced Product Documentation with AI...',
        cancellable: false
    }, async (progress) => {
        try {
            // Reset run context for new generation
            currentProductDocsRun = null;
            
            progress.report({ message: 'Step 1/3: Analyzing files individually...' });
            SWLogger.log('Step 1/3: analyzing files...');
            
            // Use enhanced documentation generation with incremental save callbacks
            lastEnhancedProductDocs = await llmService.generateEnhancedProductDocs(
                lastCodeAnalysis!,
                workspaceRoot,
                {
                    onFileStart: (filePath, index, total) => {
                        // Update progress notification to show which file is being submitted to LLM
                        progress.report({ 
                            message: `Step 1/3: Submitting file ${index}/${total} to LLM: ${path.basename(filePath)}`
                        });
                        SWLogger.log(`Submitting file ${index}/${total} to LLM: ${filePath}`);
                    },
                    onFileSummary: (summary, index, total) => {
                        saveIncrementalFileSummary(summary, workspaceRoot, index, total);
                        // Update progress notification to show which file was received from LLM
                        progress.report({ 
                            message: `Step 1/3: Received file ${index}/${total} from LLM: ${path.basename(summary.file)}`
                        });
                        SWLogger.log(`Received file ${index}/${total} from LLM: ${summary.file}`);
                        // Refresh product navigator to show new files
                        if (productNavigator) {
                            productNavigator.refresh();
                        }
                    },
                    onModuleSummary: (summary, index, total) => {
                        saveIncrementalModuleSummary(summary, workspaceRoot, index, total);
                        // Update progress notification to show incremental progress
                        progress.report({ 
                            message: `Step 2/3: Generating module summaries (${index}/${total}): ${path.basename(summary.module)}`
                        });
                        // Refresh product navigator to show new files
                        if (productNavigator) {
                            productNavigator.refresh();
                        }
                    },
                    onProductDocIteration: (doc, iteration, maxIterations) => {
                        saveIncrementalProductDocIteration(doc, workspaceRoot, iteration, maxIterations);
                        // Update progress notification to show incremental progress
                        progress.report({ 
                            message: `Step 3/3: Generating product documentation (iteration ${iteration}/${maxIterations})`
                        });
                        // Refresh product navigator to show new files
                        if (productNavigator) {
                            productNavigator.refresh();
                        }
                    }
                }
            );
            
            // Update UI to show complete status
            if (treeProvider) {
                treeProvider.setProductDocsStatus('complete');
            }
            SWLogger.log('Status: complete');

            // Update product navigator
            if (productNavigator) {
                productNavigator.setProductDocs(lastEnhancedProductDocs);
            }
            
            progress.report({ message: 'Step 2/3: Saving documentation...' });
            
            // Save enhanced docs to .shadow folder
            await saveEnhancedProductDocsToFile(lastEnhancedProductDocs, workspaceRoot);
            SWLogger.log('Saved docs to .shadow/docs');
            
            progress.report({ message: 'Step 3/3: Complete' });
            
            vscode.window.showInformationMessage('✅ Enhanced product documentation generated! Browse in "Product Navigator" view.');
        } catch (error: any) {
            // Reset to idle on error
            if (treeProvider) {
                treeProvider.setProductDocsStatus('idle');
            }
            console.error('Error generating enhanced docs:', error);
            SWLogger.log(`ERROR generating product docs: ${error?.message || error}`);
            vscode.window.showErrorMessage(`Failed to generate documentation: ${error.message}`);
        }
    });
}

export async function generateLLMInsights() {
    // Prevent duplicate calls
    if (treeProvider && treeProvider.getInsightsStatus() === 'generating') {
        vscode.window.showWarningMessage('Architecture insights generation is already in progress. Please wait...');
        return;
    }

    if (!llmService.isConfigured()) {
        const result = await vscode.window.showWarningMessage(
            'OpenAI API key not configured. Would you like to set it now?',
            'Set API Key',
            'Cancel'
        );
        
        if (result === 'Set API Key') {
            await setApiKey();
            if (!llmService.isConfigured()) {
                return;
            }
        } else {
            return;
        }
    }

    // Check if analysis is available (try loading if not already loaded)
    if (!lastAnalysisContext) {
        // Try to load saved analysis one more time
        await loadSavedCodeAnalysis();
        if (!lastAnalysisContext) {
            vscode.window.showErrorMessage('Please run "Analyze Workspace" first');
            return;
        }
    }

    // Check if product docs are available (recommended but not required)
    if (!lastEnhancedProductDocs) {
        // Try to load saved docs one more time
        await loadSavedProductDocs();
        const result = await vscode.window.showWarningMessage(
            'Product documentation not generated yet. Architecture insights will be more accurate with product docs. Generate them now?',
            'Generate Product Docs First',
            'Continue Without Docs'
        );
        
        if (result === 'Generate Product Docs First') {
            await generateProductDocs();
            // If generation was successful, continue with insights
            if (!lastEnhancedProductDocs) {
                return;
            }
        }
    }

    // Update UI to show generating status
    if (treeProvider) {
        treeProvider.setInsightsStatus('generating');
    }
    SWLogger.section('Generate Architecture Insights');
    SWLogger.log('Status: generating');

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating Architecture Insights with AI...',
        cancellable: false
    }, async (progress) => {
        try {
            if (!lastAnalysisContext) {
                throw new Error('No analysis context available. Please run workspace analysis first.');
            }

            const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
            
            progress.report({ message: 'Step 1/2: Analyzing product purpose and architecture rationale...' });
            console.log('Starting architecture insights generation...');
            console.log('Analysis context:', {
                totalFiles: lastAnalysisContext.totalFiles,
                totalLines: lastAnalysisContext.totalLines,
                entryPoints: lastAnalysisContext.entryPoints.length,
                hasProductDocs: !!lastEnhancedProductDocs
            });
            
            // Log to output channel
            if (outputChannel) {
                outputChannel.clear();
                outputChannel.appendLine('═══════════════════════════════════════════════════════════');
                outputChannel.appendLine('🧠 GENERATING ARCHITECTURE INSIGHTS (Multi-Step Process)');
                outputChannel.appendLine('═══════════════════════════════════════════════════════════');
                const currentProvider = llmService.getProvider();
                const providerName = currentProvider === 'claude' ? 'Claude' : 'OpenAI';
                outputChannel.appendLine(`🤖 LLM Provider: ${providerName} (${currentProvider})`);
                outputChannel.appendLine(`📊 Analysis Context: ${lastAnalysisContext.totalFiles} files, ${lastAnalysisContext.totalLines} lines`);
                if (lastEnhancedProductDocs) {
                    outputChannel.appendLine('📚 Product documentation available - will analyze product purpose first');
                }
                outputChannel.show(true);
            }
            
            // Reset run context for new generation
            currentArchitectureInsightsRun = null;
            
            // Generate insights using both analysis and product docs
            // This now does: Step 1) Analyze product purpose, Step 2) Generate contextual recommendations
            progress.report({ message: 'Step 2/2: Generating contextual architecture recommendations...' });
            lastLLMInsights = await llmService.generateArchitectureInsights(
                lastAnalysisContext,
                lastCodeAnalysis || undefined,
                lastEnhancedProductDocs || undefined,
                {
                    onProductPurposeStart: () => {
                        // Update progress notification to show product purpose is being submitted
                        progress.report({ message: 'Step 1/2: Submitting product purpose analysis to LLM...' });
                        SWLogger.log('Submitting product purpose analysis to LLM');
                    },
                    onProductPurposeAnalysis: (productPurpose) => {
                        saveIncrementalProductPurposeAnalysis(productPurpose, workspaceRoot);
                        // Update progress notification to show product purpose analysis received
                        progress.report({ message: 'Step 1/2: Received product purpose analysis from LLM' });
                        SWLogger.log('Received product purpose analysis from LLM');
                        // Refresh insights viewer to show incremental data
                        if (insightsViewer) {
                            insightsViewer.refresh();
                        }
                    },
                    onInsightsIterationStart: (iteration, maxIterations) => {
                        // Update progress notification to show iteration is being submitted
                        progress.report({ 
                            message: `Step 2/2: Submitting architecture insights iteration ${iteration}/${maxIterations} to LLM...`
                        });
                        SWLogger.log(`Submitting architecture insights iteration ${iteration}/${maxIterations} to LLM`);
                    },
                    onInsightsIteration: (insights, iteration, maxIterations) => {
                        console.log('[llmIntegration] onInsightsIteration callback called:', {
                            iteration,
                            maxIterations,
                            hasInsights: !!insights,
                            insightsKeys: insights ? Object.keys(insights) : []
                        });
                        
                        saveIncrementalArchitectureInsightsIteration(insights, workspaceRoot, iteration, maxIterations);
                        
                        // Update progress notification to show iteration was received
                        progress.report({ 
                            message: `Step 2/2: Received architecture insights iteration ${iteration}/${maxIterations} from LLM`
                        });
                        SWLogger.log(`Received architecture insights iteration ${iteration}/${maxIterations} from LLM`);
                        
                        // Refresh insights viewer to show incremental data
                        console.log('[llmIntegration] Setting insights on viewer, insightsViewer exists:', !!insightsViewer);
                        if (insightsViewer) {
                            console.log('[llmIntegration] Calling insightsViewer.setInsights() with:', {
                                hasOverall: !!insights.overallAssessment,
                                strengthsCount: insights.strengths?.length || 0,
                                issuesCount: insights.issues?.length || 0
                            });
                            insightsViewer.setInsights(insights);
                        } else {
                            console.warn('[llmIntegration] insightsViewer is null, cannot update UI');
                        }
                    }
                }
            );
            SWLogger.log('Insights generated');
            
            // Debug: Log insights to console and output channel
            console.log('Generated LLM Insights object:', {
                hasRawContent: !!lastLLMInsights.rawContent,
                rawContentLength: lastLLMInsights.rawContent?.length || 0,
                hasOverall: !!lastLLMInsights.overallAssessment,
                strengthsCount: lastLLMInsights.strengths?.length || 0,
                issuesCount: lastLLMInsights.issues?.length || 0
            });
            console.log('Full LLM Insights JSON:', JSON.stringify(lastLLMInsights, null, 2));
            
            // Log to output channel
            if (outputChannel) {
                outputChannel.appendLine(`✅ API Response received`);
                outputChannel.appendLine(`📏 Raw content length: ${lastLLMInsights.rawContent?.length || 0} characters`);
                if (lastLLMInsights.rawContent && lastLLMInsights.rawContent.length > 0) {
                    outputChannel.appendLine('📄 Raw response (first 500 chars):');
                    outputChannel.appendLine(lastLLMInsights.rawContent.substring(0, 500));
                    outputChannel.appendLine('');
                    outputChannel.appendLine('📊 Parsing results:');
                    outputChannel.appendLine(`  - Overall Assessment: ${lastLLMInsights.overallAssessment ? '✅ Found' : '❌ Missing'}`);
                    outputChannel.appendLine(`  - Strengths: ${lastLLMInsights.strengths?.length || 0} items`);
                    outputChannel.appendLine(`  - Issues: ${lastLLMInsights.issues?.length || 0} items`);
                    outputChannel.appendLine(`  - Organization: ${lastLLMInsights.organization ? '✅ Found' : '❌ Missing'}`);
                    outputChannel.appendLine(`  - Recommendations: ${lastLLMInsights.recommendations?.length || 0} items`);
                } else {
                    outputChannel.appendLine('❌ ERROR: Raw content is empty!');
                    outputChannel.appendLine('This suggests the API call returned no content.');
                }
            }
            
            // Check if insights are empty
            const hasInsights = lastLLMInsights.overallAssessment || 
                               (lastLLMInsights.strengths && lastLLMInsights.strengths.length > 0) ||
                               (lastLLMInsights.issues && lastLLMInsights.issues.length > 0) ||
                               lastLLMInsights.organization ||
                               lastLLMInsights.folderReorganization ||
                               (lastLLMInsights.recommendations && lastLLMInsights.recommendations.length > 0) ||
                               (lastLLMInsights.priorities && lastLLMInsights.priorities.length > 0);
            
            if (!hasInsights) {
                const hasRawContent = lastLLMInsights.rawContent && lastLLMInsights.rawContent.length > 0;
                if (hasRawContent) {
                    vscode.window.showWarningMessage('⚠️ LLM insights parsing failed, but raw response is available. Check the output channel.');
                    console.warn('Parsing failed but raw content exists:', lastLLMInsights.rawContent?.substring(0, 500) || '');
                } else {
                    vscode.window.showErrorMessage('❌ LLM returned empty response. Check console for API error details.');
                    console.error('Both parsed insights and raw content are empty!');
                }
            }
            
            progress.report({ message: 'Saving insights...' });
            
            // Save to .shadow folder in project
            await saveArchitectureInsightsToFile(lastLLMInsights);
            SWLogger.log('Saved insights to .shadow/docs');
            
            // Update tree view with LLM insights
            if (treeProvider) {
                treeProvider.setLLMInsights(lastLLMInsights);
                treeProvider.setInsightsStatus('complete');
                console.log('Set LLM insights on tree provider');
                // Force refresh to ensure UI updates
                treeProvider.refresh();
            } else {
                console.warn('Tree provider is null!');
            }
            SWLogger.log('Status: complete');

            
            progress.report({ message: 'Displaying insights...' });
            // Only show in output channel, not in webview (removed duplicate top window)
            await showArchitectureInsightsInOutput();
            
            vscode.window.showInformationMessage('✅ AI architecture insights generated and saved to .shadow/docs/');
        } catch (error: any) {
            // Reset to idle on error
            if (treeProvider) {
                treeProvider.setInsightsStatus('idle');
            }
            SWLogger.log(`ERROR generating insights: ${error?.message || error}`);
            
            // Log error to output channel with detailed error information
            if (outputChannel) {
                outputChannel.appendLine('');
                outputChannel.appendLine('❌ ERROR OCCURRED:');
                outputChannel.appendLine(`Message: ${error.message}`);
                outputChannel.appendLine(`Status: ${error.status || 'N/A'}`);
                
                // Try to extract more details from the error message
                if (error.message.includes('empty response')) {
                    outputChannel.appendLine('');
                    outputChannel.appendLine('🔍 DIAGNOSTIC INFO:');
                    outputChannel.appendLine('The LLM API returned an empty response. This could be due to:');
                    outputChannel.appendLine('  1. Content filter blocking the response');
                    outputChannel.appendLine('  2. Token limit reached (response truncated)');
                    outputChannel.appendLine('  3. Model not available or rate limited');
                    outputChannel.appendLine('  4. API key issues or quota exceeded');
                    outputChannel.appendLine('');
                    outputChannel.appendLine('💡 TROUBLESHOOTING:');
                    outputChannel.appendLine('  - Check the full error message above for model and finish_reason');
                    outputChannel.appendLine('  - Try generating product docs first (may help with context)');
                    outputChannel.appendLine('  - Check OpenAI API status and your quota');
                    outputChannel.appendLine('  - Try again - sometimes transient API issues occur');
                }
                
                if (error.message.includes('All models failed')) {
                    outputChannel.appendLine('');
                    outputChannel.appendLine('🔍 DIAGNOSTIC INFO:');
                    outputChannel.appendLine('All attempted models failed. This could be due to:');
                    outputChannel.appendLine('  1. Model names not available (gpt-5.1, gpt-5 may not exist)');
                    outputChannel.appendLine('  2. API key issues or authentication problems');
                    outputChannel.appendLine('  3. Rate limiting or quota exceeded');
                    outputChannel.appendLine('  4. Network connectivity issues');
                }
                
                outputChannel.appendLine('');
                outputChannel.appendLine('📋 FULL ERROR DETAILS:');
                outputChannel.appendLine(`Stack: ${error.stack || 'N/A'}`);
                if (error.response) {
                    outputChannel.appendLine(`API Response: ${JSON.stringify(error.response, null, 2)}`);
                }
                outputChannel.show(true);
            }
            
            console.error('Full error object:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            // Show a more helpful error message to the user
            const shortMessage = error.message.length > 200 
                ? error.message.substring(0, 200) + '...' 
                : error.message;
            vscode.window.showErrorMessage(`Failed to generate insights: ${shortMessage}. Check "Shadow Watch Documentation" output panel for details.`);
        }
    });
}

export async function showProductDocs() {
    if (!lastEnhancedProductDocs) {
        vscode.window.showWarningMessage('No product documentation generated yet. Run "Generate Product Documentation" first.');
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'shadowWatchProductDocs',
        '📚 Enhanced Product Documentation',
        vscode.ViewColumn.One,
        { enableScripts: false }
    );

    panel.webview.html = getEnhancedProductDocsHtml(lastEnhancedProductDocs);
}

export async function showLLMInsights() {
    if (!lastLLMInsights) {
        vscode.window.showWarningMessage('No AI insights generated yet. Run "Generate AI Architecture Insights" first.');
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'shadowWatchLLMInsights',
        '🧠 AI Architecture Insights',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    panel.webview.html = getLLMInsightsHtml(lastLLMInsights);
}

// Legacy saveProductDocsToFile removed - using enhanced docs only

// Incremental save helpers for product docs
interface ProductDocsRunContext {
    runId: string;
    runDir: string;
    startTime: Date;
}

let currentProductDocsRun: ProductDocsRunContext | null = null;

function getProductDocsRunDir(workspaceRoot: string): string {
    if (!currentProductDocsRun) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const runId = `product-docs-${timestamp}`;
        const shadowDir = path.join(workspaceRoot, '.shadow');
        const docsDir = path.join(shadowDir, 'docs');
        const runDir = path.join(docsDir, runId);
        
        currentProductDocsRun = {
            runId,
            runDir,
            startTime: new Date()
        };
        
        // Create directory structure
        if (!fs.existsSync(runDir)) {
            fs.mkdirSync(runDir, { recursive: true });
        }
    }
    return currentProductDocsRun.runDir;
}

function saveIncrementalFileSummary(fileSummary: any, workspaceRoot: string, index: number, total: number): void {
    try {
        const runDir = getProductDocsRunDir(workspaceRoot);
        const filePath = path.join(runDir, `file-summaries`, `${String(index).padStart(4, '0')}-${path.basename(fileSummary.file).replace(/[^a-zA-Z0-9.-]/g, '_')}.json`);
        
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
        updateFileSummariesAggregate(runDir, fileSummary, index, total);
    } catch (error) {
        console.error('Failed to save incremental file summary:', error);
    }
}

function updateFileSummariesAggregate(runDir: string, fileSummary: any, index: number, total: number): void {
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

function saveIncrementalModuleSummary(moduleSummary: any, workspaceRoot: string, index: number, total: number): void {
    try {
        const runDir = getProductDocsRunDir(workspaceRoot);
        const modulePath = path.join(runDir, `module-summaries`, `${String(index).padStart(4, '0')}-${path.basename(moduleSummary.module).replace(/[^a-zA-Z0-9.-]/g, '_')}.json`);
        
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
        updateModuleSummariesAggregate(runDir, moduleSummary, index, total);
    } catch (error) {
        console.error('Failed to save incremental module summary:', error);
    }
}

function updateModuleSummariesAggregate(runDir: string, moduleSummary: any, index: number, total: number): void {
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

function saveIncrementalProductDocIteration(productDoc: any, workspaceRoot: string, iteration: number, maxIterations: number): void {
    try {
        const runDir = getProductDocsRunDir(workspaceRoot);
        const iterationPath = path.join(runDir, `product-doc-iteration-${iteration}.json`);
        
        const docWithMetadata = {
            ...productDoc,
            _metadata: {
                iteration,
                maxIterations,
                savedAt: new Date().toISOString()
            }
        };
        fs.writeFileSync(iterationPath, JSON.stringify(docWithMetadata, null, 2), 'utf-8');
        
        // Also save as markdown
        const markdownPath = path.join(runDir, `product-doc-iteration-${iteration}.md`);
        const markdown = formatEnhancedDocsAsMarkdown(productDoc);
        fs.writeFileSync(markdownPath, markdown, 'utf-8');
    } catch (error) {
        console.error('Failed to save incremental product doc iteration:', error);
    }
}

async function saveEnhancedProductDocsToFile(
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
        const runDir = currentProductDocsRun?.runDir;
        if (!runDir) {
            throw new Error('No run directory available for saving product docs');
        }
        
        // Save as markdown
        const markdownPath = path.join(runDir, 'enhanced-product-documentation.md');
        const markdown = formatEnhancedDocsAsMarkdown(docs);
        fs.writeFileSync(markdownPath, markdown, 'utf-8');

        // Also save raw JSON with timestamp metadata
        const jsonPath = path.join(runDir, 'enhanced-product-documentation.json');
        const docsWithMetadata = {
            ...docs,
            _metadata: {
                generatedAt: new Date().toISOString(),
                generatedAtLocal: new Date().toLocaleString(),
                runId: currentProductDocsRun?.runId
            }
        };
        fs.writeFileSync(jsonPath, JSON.stringify(docsWithMetadata, null, 2), 'utf-8');
        
        // Reset run context
        currentProductDocsRun = null;
    } catch (error) {
        console.error('Failed to save enhanced documentation:', error);
        vscode.window.showWarningMessage(`Failed to save enhanced documentation: ${error}`);
    }
}

function formatEnhancedDocsAsMarkdown(docs: EnhancedProductDocumentation): string {
    const now = new Date();
    const dateStamp = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const localDateStamp = now.toLocaleString();
    
    let md = '# Product Documentation\n\n';
    md += `*Generated: ${localDateStamp} (${dateStamp})*\n\n`;
    md += '---\n\n';

    // Product Overview
    if (docs.overview) {
        md += `## Product Overview\n\n${docs.overview}\n\n`;
    }

    // What It Does
    if (docs.whatItDoes && docs.whatItDoes.length > 0) {
        md += `## What It Does\n\n`;
        docs.whatItDoes.forEach(feature => md += `- ${feature}\n`);
        md += '\n';
    }

    // User Perspective
    if (docs.userPerspective) {
        md += `## User Perspective\n\n`;
        if (docs.userPerspective.gui && docs.userPerspective.gui.length > 0) {
            md += `### GUI\n\n`;
            docs.userPerspective.gui.forEach(item => md += `- ${item}\n`);
            md += '\n';
        }
        if (docs.userPerspective.cli && docs.userPerspective.cli.length > 0) {
            md += `### CLI\n\n`;
            docs.userPerspective.cli.forEach(item => md += `- ${item}\n`);
            md += '\n';
        }
        if (docs.userPerspective.api && docs.userPerspective.api.length > 0) {
            md += `### API\n\n`;
            docs.userPerspective.api.forEach(item => md += `- ${item}\n`);
            md += '\n';
        }
        if (docs.userPerspective.cicd && docs.userPerspective.cicd.length > 0) {
            md += `### CI/CD\n\n`;
            docs.userPerspective.cicd.forEach(item => md += `- ${item}\n`);
            md += '\n';
        }
    }

    // Workflow Integration
    if (docs.workflowIntegration && docs.workflowIntegration.length > 0) {
        md += `## Workflow Integration\n\n`;
        docs.workflowIntegration.forEach(workflow => md += `- ${workflow}\n`);
        md += '\n';
    }

    // Problems Solved
    if (docs.problemsSolved && docs.problemsSolved.length > 0) {
        md += `## Problems Solved\n\n`;
        docs.problemsSolved.forEach(problem => md += `- ${problem}\n`);
        md += '\n';
    }

    // Architecture Summary
    if (docs.architecture) {
        md += `## Architecture Summary\n\n${docs.architecture}\n\n`;
    }

    // Module Documentation
    if (docs.modules && docs.modules.length > 0) {
        md += `## Module Documentation\n\n`;
        for (const module of docs.modules) {
            md += `### ${module.module} (${module.moduleType})\n\n`;
            if (module.summary) {
                md += `${module.summary}\n\n`;
            }
            if (module.capabilities && module.capabilities.length > 0) {
                md += `**Capabilities:**\n`;
                module.capabilities.forEach(cap => md += `- ${cap}\n`);
                md += '\n';
            }
            if (module.endpoints && module.endpoints.length > 0) {
                md += `**Endpoints:**\n`;
                module.endpoints.forEach(ep => {
                    const method = ep.method ? `${ep.method} ` : '';
                    md += `- ${method}${ep.path}: ${ep.description}\n`;
                });
                md += '\n';
            }
            if (module.commands && module.commands.length > 0) {
                md += `**Commands:**\n`;
                module.commands.forEach(cmd => md += `- \`${cmd.command}\`: ${cmd.description}\n`);
                md += '\n';
            }
            if (module.workers && module.workers.length > 0) {
                md += `**Workers:**\n`;
                module.workers.forEach(worker => {
                    md += `- ${worker.name}: ${worker.description}\n`;
                    if (worker.jobFlow) {
                        md += `  - Flow: ${worker.jobFlow}\n`;
                    }
                });
                md += '\n';
            }
        }
    }

    // File-Level Documentation (Appendix)
    if (docs.fileSummaries && docs.fileSummaries.length > 0) {
        md += `## File-Level Documentation\n\n`;
        md += `*Detailed documentation for ${docs.fileSummaries.length} files*\n\n`;
        for (const file of docs.fileSummaries.slice(0, 20)) { // Limit to first 20 for readability
            md += `### ${file.file}\n\n`;
            md += `**Role:** ${file.role}\n\n`;
            if (file.purpose) {
                md += `**Purpose:** ${file.purpose}\n\n`;
            }
            if (file.userVisibleActions && file.userVisibleActions.length > 0) {
                md += `**User Actions:**\n`;
                file.userVisibleActions.forEach(action => md += `- ${action}\n`);
                md += '\n';
            }
            if (file.keyFunctions && file.keyFunctions.length > 0) {
                md += `**Key Functions:**\n`;
                file.keyFunctions.forEach(func => {
                    md += `- \`${func.name}\`: ${func.desc}\n`;
                    if (func.inputs) md += `  - Inputs: ${func.inputs}\n`;
                    if (func.outputs) md += `  - Outputs: ${func.outputs}\n`;
                });
                md += '\n';
            }
        }
        if (docs.fileSummaries.length > 20) {
            md += `\n*... and ${docs.fileSummaries.length - 20} more files*\n`;
        }
    }

    return md;
}

// Incremental save helpers for architecture insights
interface ArchitectureInsightsRunContext {
    runId: string;
    runDir: string;
    startTime: Date;
}

let currentArchitectureInsightsRun: ArchitectureInsightsRunContext | null = null;

function getArchitectureInsightsRunDir(workspaceRoot: string): string {
    if (!currentArchitectureInsightsRun) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const runId = `architecture-insights-${timestamp}`;
        const shadowDir = path.join(workspaceRoot, '.shadow');
        const docsDir = path.join(shadowDir, 'docs');
        const runDir = path.join(docsDir, runId);
        
        currentArchitectureInsightsRun = {
            runId,
            runDir,
            startTime: new Date()
        };
        
        // Create directory structure
        if (!fs.existsSync(runDir)) {
            fs.mkdirSync(runDir, { recursive: true });
        }
    }
    return currentArchitectureInsightsRun.runDir;
}

function saveIncrementalProductPurposeAnalysis(productPurpose: any, workspaceRoot: string): void {
    const runDir = getArchitectureInsightsRunDir(workspaceRoot);
    const storage = createTimestampedStorage<any>(runDir, 'product-purpose-analysis');
    storage.saveSync(productPurpose);
}

function saveIncrementalArchitectureInsightsIteration(insights: any, workspaceRoot: string, iteration: number, maxIterations: number): void {
    try {
        const runDir = getArchitectureInsightsRunDir(workspaceRoot);
        const iterationPath = path.join(runDir, `architecture-insights-iteration-${iteration}.json`);
        
        console.log('[llmIntegration] Saving architecture insights iteration', iteration, 'to:', iterationPath);
        console.log('[llmIntegration] Insights data being saved:', {
            hasOverall: !!insights.overallAssessment,
            strengthsCount: insights.strengths?.length || 0,
            issuesCount: insights.issues?.length || 0,
            recommendationsCount: insights.recommendations?.length || 0,
            prioritiesCount: insights.priorities?.length || 0,
            hasOrganization: !!insights.organization,
            hasEntryPointsAnalysis: !!insights.entryPointsAnalysis,
            hasOrphanedFilesAnalysis: !!insights.orphanedFilesAnalysis,
            hasFolderReorganization: !!insights.folderReorganization,
            hasCursorPrompt: !!insights.cursorPrompt,
            hasProductPurposeAnalysis: !!insights.productPurposeAnalysis,
            keys: Object.keys(insights)
        });
        
        const insightsWithMetadata = {
            ...insights,
            _metadata: {
                iteration,
                maxIterations,
                savedAt: new Date().toISOString()
            }
        };
        fs.writeFileSync(iterationPath, JSON.stringify(insightsWithMetadata, null, 2), 'utf-8');
        console.log('[llmIntegration] Successfully saved iteration file, size:', fs.statSync(iterationPath).size, 'bytes');
        
        // Also save as markdown
        const markdownPath = path.join(runDir, `architecture-insights-iteration-${iteration}.md`);
        const markdown = formatInsightsAsMarkdown(insights);
        fs.writeFileSync(markdownPath, markdown, 'utf-8');
        console.log('[llmIntegration] Successfully saved markdown file');
    } catch (error) {
        console.error('[llmIntegration] Failed to save incremental architecture insights iteration:', error);
        console.error('[llmIntegration] Error details:', error instanceof Error ? error.stack : error);
    }
}

async function saveArchitectureInsightsToFile(insights: LLMInsights): Promise<void> {
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
        const runDir = currentArchitectureInsightsRun?.runDir;
        if (!runDir) {
            throw new Error('No run directory available for saving architecture insights');
        }
        
        // Save as markdown
        const markdownPath = path.join(runDir, 'architecture-insights.md');
        const markdown = formatInsightsAsMarkdown(insights);
        fs.writeFileSync(markdownPath, markdown, 'utf-8');

        // Also save raw JSON for programmatic access with timestamp metadata
        const jsonPath = path.join(runDir, 'architecture-insights.json');
        const insightsWithMetadata = {
            ...insights,
            _metadata: {
                generatedAt: new Date().toISOString(),
                generatedAtLocal: new Date().toLocaleString(),
                runId: currentArchitectureInsightsRun?.runId
            }
        };
        fs.writeFileSync(jsonPath, JSON.stringify(insightsWithMetadata, null, 2), 'utf-8');
        
        // Reset run context
        currentArchitectureInsightsRun = null;
    } catch (error) {
        console.error('Failed to save architecture insights:', error);
        vscode.window.showWarningMessage(`Failed to save architecture insights: ${error}`);
    }
}

// Legacy formatDocsAsMarkdown removed - using enhanced docs only

async function showProductDocsInOutput(): Promise<void> {
    if (!lastEnhancedProductDocs || !outputChannel) {
        return;
    }

    const channel = outputChannel;
    channel.clear();
    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine('📚 ENHANCED PRODUCT DOCUMENTATION');
    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine('');

    if (lastEnhancedProductDocs.overview) {
        channel.appendLine('PRODUCT OVERVIEW');
        channel.appendLine('─────────────────────────────────────────────────────────');
        channel.appendLine(lastEnhancedProductDocs.overview);
        channel.appendLine('');
    }

    if (lastEnhancedProductDocs.whatItDoes && lastEnhancedProductDocs.whatItDoes.length > 0) {
        channel.appendLine('WHAT IT DOES');
        channel.appendLine('─────────────────────────────────────────────────────────');
        lastEnhancedProductDocs.whatItDoes.forEach(f => channel.appendLine(`  • ${f}`));
        channel.appendLine('');
    }

    if (lastEnhancedProductDocs.architecture) {
        channel.appendLine('ARCHITECTURE SUMMARY');
        channel.appendLine('─────────────────────────────────────────────────────────');
        channel.appendLine(lastEnhancedProductDocs.architecture);
        channel.appendLine('');
    }

    if (lastEnhancedProductDocs.modules && lastEnhancedProductDocs.modules.length > 0) {
        channel.appendLine('MODULES');
        channel.appendLine('─────────────────────────────────────────────────────────');
        lastEnhancedProductDocs.modules.forEach(m => {
            channel.appendLine(`\n${m.module} (${m.moduleType})`);
            channel.appendLine(`  ${m.summary}`);
            if (m.capabilities && m.capabilities.length > 0) {
                channel.appendLine(`  Capabilities: ${m.capabilities.join(', ')}`);
            }
        });
        channel.appendLine('');
    }

    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine(`Documentation saved to: .shadow/docs/enhanced-product-documentation.json`);
    channel.show(true);
}

function formatInsightsAsMarkdown(insights: LLMInsights): string {
    const now = new Date();
    const dateStamp = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const localDateStamp = now.toLocaleString();
    
    let md = '# AI Architecture Insights\n\n';
    md += `*Generated: ${localDateStamp} (${dateStamp})*\n\n`;
    md += '---\n\n';
    
    if (insights.overallAssessment) {
        md += `## Overall Architecture Assessment\n\n${insights.overallAssessment}\n\n`;
    }

    if (insights.strengths && insights.strengths.length > 0) {
        md += `## Strengths\n\n`;
        insights.strengths.forEach(s => md += `- ${s}\n`);
        md += '\n';
    }

    if (insights.issues && insights.issues.length > 0) {
        md += `## Issues & Concerns\n\n`;
        insights.issues.forEach(i => md += `- ${i}\n`);
        md += '\n';
    }

    if (insights.organization) {
        md += `## Code Organization\n\n${insights.organization}\n\n`;
    }

    if (insights.entryPointsAnalysis) {
        md += `## Entry Points Analysis\n\n${insights.entryPointsAnalysis}\n\n`;
    }

    if (insights.orphanedFilesAnalysis) {
        md += `## Orphaned Files Analysis\n\n${insights.orphanedFilesAnalysis}\n\n`;
    }

    if (insights.folderReorganization) {
        md += `## Folder Reorganization Suggestions\n\n${insights.folderReorganization}\n\n`;
    }

    if (insights.recommendations && insights.recommendations.length > 0) {
        md += `## Recommendations\n\n`;
        insights.recommendations.forEach(r => md += `- ${r}\n`);
        md += '\n';
    }

    if (insights.priorities && insights.priorities.length > 0) {
        md += `## Refactoring Priorities\n\n`;
        insights.priorities.forEach(p => md += `- ${p}\n`);
        md += '\n';
    }

    if (insights.cursorPrompt) {
        md += `---\n\n## LLM Refactoring Prompt\n\n\`\`\`\n${insights.cursorPrompt}\n\`\`\`\n`;
    }

    return md;
}

async function showArchitectureInsightsInOutput(): Promise<void> {
    if (!lastLLMInsights || !outputChannel) {
        return;
    }

    const channel = outputChannel; // TypeScript guard
    channel.clear();
    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine('🧠 AI ARCHITECTURE INSIGHTS');
    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine('');

    if (lastLLMInsights.overallAssessment) {
        channel.appendLine('OVERALL ARCHITECTURE ASSESSMENT');
        channel.appendLine('─────────────────────────────────────────────────────────');
        channel.appendLine(lastLLMInsights.overallAssessment);
        channel.appendLine('');
    }

    if (lastLLMInsights.strengths && lastLLMInsights.strengths.length > 0) {
        channel.appendLine('STRENGTHS');
        channel.appendLine('─────────────────────────────────────────────────────────');
        lastLLMInsights.strengths.forEach(s => channel.appendLine(`  ✅ ${s}`));
        channel.appendLine('');
    }

    if (lastLLMInsights.issues && lastLLMInsights.issues.length > 0) {
        channel.appendLine('ISSUES & CONCERNS');
        channel.appendLine('─────────────────────────────────────────────────────────');
        lastLLMInsights.issues.forEach(i => channel.appendLine(`  ⚠️  ${i}`));
        channel.appendLine('');
    }

    if (lastLLMInsights.organization) {
        channel.appendLine('CODE ORGANIZATION');
        channel.appendLine('─────────────────────────────────────────────────────────');
        channel.appendLine(lastLLMInsights.organization);
        channel.appendLine('');
    }

    if (lastLLMInsights.entryPointsAnalysis) {
        channel.appendLine('ENTRY POINTS ANALYSIS');
        channel.appendLine('─────────────────────────────────────────────────────────');
        channel.appendLine(lastLLMInsights.entryPointsAnalysis);
        channel.appendLine('');
    }

    if (lastLLMInsights.orphanedFilesAnalysis) {
        channel.appendLine('ORPHANED FILES ANALYSIS');
        channel.appendLine('─────────────────────────────────────────────────────────');
        channel.appendLine(lastLLMInsights.orphanedFilesAnalysis);
        channel.appendLine('');
    }

    if (lastLLMInsights.folderReorganization) {
        channel.appendLine('FOLDER REORGANIZATION SUGGESTIONS');
        channel.appendLine('─────────────────────────────────────────────────────────');
        channel.appendLine(lastLLMInsights.folderReorganization);
        channel.appendLine('');
    }

    if (lastLLMInsights.recommendations && lastLLMInsights.recommendations.length > 0) {
        channel.appendLine('RECOMMENDATIONS');
        channel.appendLine('─────────────────────────────────────────────────────────');
        lastLLMInsights.recommendations.forEach(r => channel.appendLine(`  💡 ${r}`));
        channel.appendLine('');
    }

    if (lastLLMInsights.priorities && lastLLMInsights.priorities.length > 0) {
        channel.appendLine('REFACTORING PRIORITIES');
        channel.appendLine('─────────────────────────────────────────────────────────');
        lastLLMInsights.priorities.forEach(p => channel.appendLine(`  🎯 ${p}`));
        channel.appendLine('');
    }

    if (lastLLMInsights.cursorPrompt) {
        channel.appendLine('LLM REFACTORING PROMPT');
        channel.appendLine('─────────────────────────────────────────────────────────');
        channel.appendLine('(Copy this prompt and paste into your AI coding assistant)');
        channel.appendLine('');
        channel.appendLine(lastLLMInsights.cursorPrompt);
        channel.appendLine('');
    }

    // If parsing failed and we have raw content, show it
    const hasAnyContent = lastLLMInsights.overallAssessment || 
                         (lastLLMInsights.strengths && lastLLMInsights.strengths.length > 0) ||
                         (lastLLMInsights.issues && lastLLMInsights.issues.length > 0) ||
                         lastLLMInsights.organization ||
                         lastLLMInsights.folderReorganization ||
                         (lastLLMInsights.recommendations && lastLLMInsights.recommendations.length > 0) ||
                         (lastLLMInsights.priorities && lastLLMInsights.priorities.length > 0);
    
    if (!hasAnyContent && lastLLMInsights.rawContent) {
        channel.appendLine('');
        channel.appendLine('⚠️ PARSING FAILED - RAW LLM RESPONSE:');
        channel.appendLine('─────────────────────────────────────────────────────────');
        channel.appendLine('The LLM response could not be parsed. Showing raw content:');
        channel.appendLine('');
        channel.appendLine(lastLLMInsights.rawContent);
        channel.appendLine('');
    }

    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine(`Insights saved to: .shadow/docs/architecture-insights.md`);
    if (lastLLMInsights.rawContent) {
        channel.appendLine(`Raw response length: ${lastLLMInsights.rawContent.length} characters`);
    }
    channel.show(true); // Show and focus the output channel
}

function getEnhancedProductDocsHtml(docs: EnhancedProductDocumentation): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
        }
        h1 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        h2 { color: #764ba2; margin-top: 30px; }
        h3 { color: #444; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .section { margin-bottom: 30px; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { 
            background: #1e1e1e; 
            color: #d4d4d4; 
            padding: 15px; 
            border-radius: 6px; 
            overflow-x: auto; 
            font-size: 0.9em;
            line-height: 1.5;
        }
        .json-example { margin-top: 10px; }
    </style>
</head>
<body>
    <h1>📚 Enhanced Product Documentation</h1>
    
    ${docs.overview ? `
    <div class="section">
        <h2>Product Overview</h2>
        <p>${escapeHtml(docs.overview)}</p>
    </div>
    ` : ''}
    
    ${docs.whatItDoes && docs.whatItDoes.length > 0 ? `
    <div class="section">
        <h2>What It Does</h2>
        <ul>
            ${docs.whatItDoes.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    ${docs.architecture ? `
    <div class="section">
        <h2>Architecture Summary</h2>
        <p>${escapeHtml(docs.architecture)}</p>
    </div>
    ` : ''}
    
    ${docs.modules && docs.modules.length > 0 ? `
    <div class="section">
        <h2>Modules</h2>
        ${docs.modules.map(m => `
            <h3>${escapeHtml(m.module)} (${escapeHtml(m.moduleType)})</h3>
            <p>${escapeHtml(m.summary || '')}</p>
            ${m.capabilities && m.capabilities.length > 0 ? `
            <p><strong>Capabilities:</strong> ${escapeHtml(m.capabilities.join(', '))}</p>
            ` : ''}
        `).join('')}
    </div>
    ` : ''}
    
    ${docs.exampleInput ? `
    <div class="section">
        <h2>Example Input</h2>
        ${docs.exampleInput.description ? `<p>${escapeHtml(docs.exampleInput.description)}</p>` : ''}
        ${docs.exampleInput.json ? `
        <div class="json-example">
            <pre><code>${escapeHtml(JSON.stringify(docs.exampleInput.json, null, 2))}</code></pre>
        </div>
        ` : ''}
    </div>
    ` : ''}
    
    ${docs.exampleOutput ? `
    <div class="section">
        <h2>Example Output</h2>
        ${docs.exampleOutput.description ? `<p>${escapeHtml(docs.exampleOutput.description)}</p>` : ''}
        ${docs.exampleOutput.json ? `
        <div class="json-example">
            <pre><code>${escapeHtml(JSON.stringify(docs.exampleOutput.json, null, 2))}</code></pre>
        </div>
        ` : ''}
    </div>
    ` : ''}
    
    <div class="section" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
        <p>💾 Documentation saved to: <code>.shadow/docs/enhanced-product-documentation.json</code></p>
        <p>📋 Also available in Output panel: <code>Shadow Watch Documentation</code></p>
    </div>
</body>
</html>`;
}

function getLLMInsightsHtml(insights: LLMInsights): string {
    const copyScript = `
        function copyToClipboard(text, buttonElement) {
            navigator.clipboard.writeText(text).then(() => {
                const btn = buttonElement || (window.event && window.event.target);
                if (btn) {
                    const orig = btn.textContent;
                    btn.textContent = '✅ Copied!';
                    btn.style.background = '#10b981';
                    setTimeout(() => {
                        btn.textContent = orig;
                        btn.style.background = '#7c3aed';
                    }, 2000);
                }
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        }
    `;

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
            max-width: 1000px;
            margin: 0 auto;
        }
        h1 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        h2 { color: #764ba2; margin-top: 30px; }
        .section { 
            margin-bottom: 25px;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #ccc;
        }
        .section.assessment { background: #f8f9fa; border-left-color: #667eea; }
        .section.strengths { background: #ecfdf5; border-left-color: #10b981; }
        .section.issues { background: #fef2f2; border-left-color: #ef4444; }
        .section.organization { background: #eff6ff; border-left-color: #2196f3; }
        .section.reorganization { background: #f0f9ff; border-left-color: #0ea5e9; }
        .section.recommendations { background: #f5f3ff; border-left-color: #8b5cf6; }
        .section.priorities { background: #fdf2f8; border-left-color: #ec4899; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .copy-btn {
            background: #7c3aed;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            margin-top: 10px;
        }
        .copy-btn:hover { background: #6d28d9; }
        pre {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 0.85em;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    ${insights.overallAssessment ? `
    <div class="section assessment">
        <h2>🏗️ Overall Architecture Assessment</h2>
        <p>${escapeHtml(insights.overallAssessment)}</p>
    </div>
    ` : ''}

    ${insights.strengths && insights.strengths.length > 0 ? `
    <div class="section strengths">
        <h2>✅ Strengths</h2>
        <ul>${insights.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
    </div>
    ` : ''}

    ${insights.issues && insights.issues.length > 0 ? `
    <div class="section issues">
        <h2>⚠️ Issues & Concerns</h2>
        <ul>${insights.issues.map(i => `<li>${escapeHtml(typeof i === 'string' ? i : i.description)}</li>`).join('')}</ul>
    </div>
    ` : ''}

    ${insights.organization ? `
    <div class="section organization">
        <h2>📁 Code Organization</h2>
        <p>${escapeHtml(insights.organization)}</p>
    </div>
    ` : ''}

    ${insights.folderReorganization ? `
    <div class="section reorganization">
        <h2>📁 Folder Reorganization Suggestions</h2>
        <p>${escapeHtml(insights.folderReorganization)}</p>
    </div>
    ` : ''}

    ${insights.recommendations && insights.recommendations.length > 0 ? `
    <div class="section recommendations">
        <h2>💡 Recommendations</h2>
        <ul>${insights.recommendations.map(r => `<li>${escapeHtml(typeof r === 'string' ? r : r.description)}</li>`).join('')}</ul>
    </div>
    ` : ''}

    ${insights.priorities && insights.priorities.length > 0 ? `
    <div class="section priorities">
        <h2>🎯 Refactoring Priorities</h2>
        <ul>${insights.priorities.map(p => `<li>${escapeHtml(typeof p === 'string' ? p : p.description)}</li>`).join('')}</ul>
    </div>
    ` : ''}

    ${insights.cursorPrompt ? `
    <div class="section">
        <h2>✨ LLM Refactoring Prompt (Copy & Paste)</h2>
        <p>Copy this entire prompt and paste it into your AI coding assistant to execute the reorganization:</p>
        <button class="copy-btn" onclick="copyToClipboard(\`${insights.cursorPrompt.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`, this)">
            📋 Copy to Clipboard
        </button>
        <pre>${escapeHtml(insights.cursorPrompt)}</pre>
    </div>
    ` : ''}

    <div class="section" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
        <p>💾 Insights saved to: <code>.shadow/docs/architecture-insights.md</code></p>
        <p>📋 Also available in Output panel: <code>Shadow Watch Documentation</code></p>
    </div>

    <script>${copyScript}</script>
</body>
</html>`;
}

export async function clearAllData(): Promise<void> {
    // Clear all in-memory state
    lastAnalysisContext = null;
    lastEnhancedProductDocs = null;
    lastLLMInsights = null;
    lastCodeAnalysis = null;

    // Clear workspace .shadow/docs files
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const docsDir = path.join(workspaceRoot, '.shadow', 'docs');

        if (fs.existsSync(docsDir)) {
            try {
                const files = fs.readdirSync(docsDir);
                const filesToDelete = [
                    'code-analysis.json',
                    'enhanced-product-documentation.json',
                    'enhanced-product-documentation.md',
                    'architecture-insights.json',
                    'architecture-insights.md'
                ];

                for (const file of files) {
                    if (filesToDelete.includes(file)) {
                        const filePath = path.join(docsDir, file);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`Deleted ${file}`);
                        }
                    }
                    
                    // Delete architecture-insights-* directories
                    if (file.startsWith('architecture-insights-') && fs.statSync(path.join(docsDir, file)).isDirectory()) {
                        const dirPath = path.join(docsDir, file);
                        try {
                            fs.rmSync(dirPath, { recursive: true, force: true });
                            console.log(`Deleted architecture insights directory: ${file}`);
                        } catch (dirError) {
                            console.error(`Error deleting architecture insights directory ${file}:`, dirError);
                        }
                    }
                }
            } catch (error) {
                console.error('Error deleting .shadow/docs files:', error);
            }
        }

        // Clear unit tests in UnitTests/
        const unitTestsDir = path.join(workspaceRoot, 'UnitTests');
        if (fs.existsSync(unitTestsDir)) {
            try {
                fs.rmSync(unitTestsDir, { recursive: true, force: true });
                console.log('Deleted unit tests directory');
            } catch (error) {
                console.error('Error deleting unit tests directory:', error);
            }
        }
    }

    // Clear tree provider state
    if (treeProvider) {
        treeProvider.clear();
        treeProvider.setProductDocsStatus('idle');
        treeProvider.setInsightsStatus('idle');
        // Note: setAnalysisComplete() doesn't take parameters, and clear() should reset analysis status
        treeProvider.refresh();
    }

    // Clear product navigator
    if (productNavigator) {
        productNavigator.setProductDocs(null);
    }


    // Clear insights viewer
    if (insightsViewer) {
        insightsViewer.setInsights(null);
    }

    // Clear analysis viewer
    if (analysisViewer) {
        analysisViewer.setAnalysis(null);
    }

    // Clear unit tests navigator
    if (unitTestsNavigator) {
        unitTestsNavigator.setUnitTestPlan(null);
        unitTestsNavigator.refresh();
    }

    // Clear output channel
    if (outputChannel) {
        outputChannel.clear();
    }
}


/**
 * Generate unit tests using LLM directly (no backend required)
 */
export async function generateUnitTests(): Promise<void> {
    // Prevent duplicate calls
    if (treeProvider && treeProvider.getUnitTestStatus() === 'generating') {
        vscode.window.showWarningMessage('Unit test generation is already in progress. Please wait or cancel the current operation.');
        return;
    }

    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    if (!llmService.isConfigured()) {
        const result = await vscode.window.showWarningMessage(
            'OpenAI API key not configured. Would you like to set it now?',
            'Set API Key',
            'Cancel'
        );
        
        if (result === 'Set API Key') {
            await setApiKey();
            if (!llmService.isConfigured()) {
                return;
            }
        } else {
            return;
        }
    }

    // Check prerequisites
    if (!lastAnalysisContext) {
        await loadSavedCodeAnalysis();
        if (!lastAnalysisContext) {
            vscode.window.showErrorMessage('Please run "Analyze Workspace" first');
            return;
        }
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

    // Load product docs and architecture insights from local files
    if (!lastEnhancedProductDocs) {
        await loadSavedProductDocs();
    }
    if (!lastLLMInsights) {
        await loadSavedInsights();
    }

    SWLogger.section('Generate Unit Tests');
    SWLogger.log(`Workspace: ${workspaceRoot}`);

    // Update UI to show generating status
    if (treeProvider) {
        treeProvider.setUnitTestStatus('generating');
    }
    SWLogger.section('Generate Unit Tests');
    SWLogger.log('Status: generating');

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating Unit Test Plan with AI...',
        cancellable: true
    }, async (progress, cancellationToken) => {
        try {
            // Check for cancellation
            if (cancellationToken.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            progress.report({ message: 'Generating unit test plan...' });
            
            // Check for cancellation before LLM call
            if (cancellationToken.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Generate unit test plan using LLM service
            const unitTestPlan = await llmService.generateUnitTestPlan(
                lastAnalysisContext!,
                lastCodeAnalysis || undefined,
                lastEnhancedProductDocs || undefined,
                lastLLMInsights || undefined,
                workspaceRoot,
                cancellationToken
            );

            // Check for cancellation before saving
            if (cancellationToken.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Save unit test plan
            progress.report({ message: 'Saving unit test plan...' });
            const unitTestDir = path.join(workspaceRoot, 'UnitTests');
            if (!fs.existsSync(unitTestDir)) {
                fs.mkdirSync(unitTestDir, { recursive: true });
            }

            // Helper function to strip HTML and markdown from test_code
            function stripHtmlAndMarkdown(text: string): string {
                if (!text) return text;
                let cleaned = text;
                // Remove markdown code blocks (```language ... ```)
                cleaned = cleaned.replace(/```[\w]*\n?/g, '');
                cleaned = cleaned.replace(/```/g, '');
                // Remove HTML tags
                cleaned = cleaned.replace(/<[^>]*>/g, '');
                // Decode HTML entities
                cleaned = cleaned.replace(/&lt;/g, '<');
                cleaned = cleaned.replace(/&gt;/g, '>');
                cleaned = cleaned.replace(/&amp;/g, '&');
                cleaned = cleaned.replace(/&quot;/g, '"');
                cleaned = cleaned.replace(/&#39;/g, "'");
                // Trim whitespace
                return cleaned.trim();
            }

            // Clean test_code in all test cases
            const cleanedTestSuites = (unitTestPlan.test_suites || []).map((suite: any) => ({
                ...suite,
                test_cases: (suite.test_cases || []).map((testCase: any) => ({
                    ...testCase,
                    test_code: testCase.test_code ? stripHtmlAndMarkdown(testCase.test_code) : testCase.test_code
                }))
            }));

            // Transform LLM response to match navigator's expected structure
            const transformedPlan = {
                rationale: unitTestPlan.rationale,
                aggregated_plan: {
                    unit_test_plan: unitTestPlan.unit_test_strategy ? {
                        strategy: unitTestPlan.unit_test_strategy.overall_approach,
                        testing_framework: Array.isArray(unitTestPlan.unit_test_strategy.testing_frameworks) 
                            ? unitTestPlan.unit_test_strategy.testing_frameworks[0] 
                            : unitTestPlan.unit_test_strategy.testing_frameworks,
                        mocking_approach: unitTestPlan.unit_test_strategy.mocking_strategy,
                        isolation_strategy: unitTestPlan.unit_test_strategy.isolation_level
                    } : undefined,
                    test_suites: cleanedTestSuites,
                    read_write_test_suites: [],
                    user_workflow_test_suites: []
                }
            };

            const planFile = path.join(unitTestDir, 'unit_test_plan.json');
            fs.writeFileSync(planFile, JSON.stringify(transformedPlan, null, 2), 'utf-8');

            SWLogger.log(`Unit test plan saved to: ${planFile}`);
            
            // Refresh the unit tests navigator to show the new plan
            if (unitTestsNavigator) {
                // Load the plan directly into the navigator
                try {
                    const content = fs.readFileSync(planFile, 'utf-8');
                    const plan = JSON.parse(content);
                    unitTestsNavigator.setUnitTestPlan(plan);
                } catch (error) {
                    console.error('Error loading unit test plan into navigator:', error);
                    // Fall back to file watcher refresh
                    unitTestsNavigator.refresh();
                }
            }
            
            vscode.window.showInformationMessage(
                '✅ Unit test plan generated! Check the "Unit Tests" panel to view it.'
            );
            
            // Reset status to complete on success
            if (treeProvider) {
                treeProvider.setUnitTestStatus('complete');
            }
        } catch (error: any) {
            // Reset status to idle on error
            if (treeProvider) {
                treeProvider.setUnitTestStatus('idle');
            }
            const errorMessage = error.message || String(error);
            SWLogger.log(`ERROR: Failed to generate unit tests: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to generate unit tests: ${errorMessage}`);
        }
    });
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
}

/**
 * Sequential workflow: Analyze Workspace → Generate Product Docs → Generate Architecture Insights → Generate Report
 */
export async function runComprehensiveAnalysis(): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    if (!llmService.isConfigured()) {
        const result = await vscode.window.showWarningMessage(
            'LLM API key not configured. Would you like to set it now?',
            'Set API Key',
            'Cancel'
        );
        
        if (result === 'Set API Key') {
            await setApiKey();
            if (!llmService.isConfigured()) {
                return;
            }
        } else {
            return;
        }
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

    // Update UI to show generating status
    if (treeProvider) {
        treeProvider.setProductDocsStatus('generating');
        treeProvider.setInsightsStatus('generating');
    }

    SWLogger.section('Comprehensive Analysis');
    SWLogger.log('Starting sequential analysis workflow...');

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Comprehensive Analysis & Report Generation',
        cancellable: true
    }, async (progress, cancellationToken) => {
        try {
            // Step 1: Ensure workspace analysis is complete
            progress.report({ message: 'Step 1/4: Analyzing workspace...', increment: 0 });
            
            if (!lastAnalysisContext || !lastCodeAnalysis) {
                await loadSavedCodeAnalysis();
                if (!lastAnalysisContext || !lastCodeAnalysis) {
                    throw new Error('Workspace analysis not found. Please run "Analyze Workspace" first.');
                }
            }

            // Step 2: Generate Product Documentation
            progress.report({ message: 'Step 2/4: Generating product documentation...', increment: 25 });
            
            if (!lastEnhancedProductDocs) {
                await loadSavedProductDocs();
            }
            
            if (!lastEnhancedProductDocs) {
                SWLogger.log('Generating product documentation...');
                if (treeProvider) {
                    treeProvider.setProductDocsStatus('generating');
                }

                lastEnhancedProductDocs = await llmService.generateEnhancedProductDocs(
                    lastCodeAnalysis!,
                    workspaceRoot,
                    {
                        onFileStart: (filePath, index, total) => {
                            if (cancellationToken.isCancellationRequested) {
                                throw new Error('Cancelled by user');
                            }
                            progress.report({ 
                                message: `Step 2/4: Analyzing file ${index}/${total}: ${path.basename(filePath)}`,
                                increment: 0
                            });
                        },
                        onFileSummary: (summary) => {
                            saveIncrementalFileSummary(summary, workspaceRoot, 0, 0);
                        },
                        onModuleSummary: (summary) => {
                            saveIncrementalModuleSummary(summary, workspaceRoot, 0, 0);
                        },
                        onProductDocIteration: (doc) => {
                            saveIncrementalProductDocIteration(doc, workspaceRoot, 1, 1);
                        }
                    }
                );

                await saveEnhancedProductDocsToFile(lastEnhancedProductDocs, workspaceRoot);
                
                if (treeProvider) {
                    treeProvider.setProductDocsStatus('complete');
                }
                if (productNavigator) {
                    productNavigator.setProductDocs(lastEnhancedProductDocs);
                }
            }

            if (cancellationToken.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Step 3: Generate Architecture Insights
            progress.report({ message: 'Step 3/4: Generating architecture insights...', increment: 25 });
            
            if (!lastLLMInsights) {
                await loadSavedInsights();
            }
            
            if (!lastLLMInsights) {
                SWLogger.log('Generating architecture insights...');
                if (treeProvider) {
                    treeProvider.setInsightsStatus('generating');
                }

                lastLLMInsights = await llmService.generateArchitectureInsights(
                    lastAnalysisContext!,
                    lastCodeAnalysis || undefined,
                    lastEnhancedProductDocs || undefined,
                    {
                        onProductPurposeStart: () => {
                            if (cancellationToken.isCancellationRequested) {
                                throw new Error('Cancelled by user');
                            }
                            progress.report({ message: 'Step 3/4: Analyzing product purpose...', increment: 0 });
                        },
                        onProductPurposeAnalysis: (productPurpose) => {
                            saveIncrementalProductPurposeAnalysis(productPurpose, workspaceRoot);
                        },
                        onInsightsIterationStart: (iteration, maxIterations) => {
                            if (cancellationToken.isCancellationRequested) {
                                throw new Error('Cancelled by user');
                            }
                            progress.report({ 
                                message: `Step 3/4: Generating insights (${iteration}/${maxIterations})...`,
                                increment: 0
                            });
                        },
                        onInsightsIteration: (insights) => {
                            saveIncrementalArchitectureInsightsIteration(insights, workspaceRoot, 1, 1);
                            if (insightsViewer) {
                                insightsViewer.setInsights(insights);
                            }
                        }
                    }
                );

                await saveArchitectureInsightsToFile(lastLLMInsights);
                
                if (treeProvider) {
                    treeProvider.setLLMInsights(lastLLMInsights);
                    treeProvider.setInsightsStatus('complete');
                }
                if (insightsViewer) {
                    insightsViewer.setInsights(lastLLMInsights);
                }
            }

            if (cancellationToken.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Step 4: Generate Comprehensive Report
            progress.report({ message: 'Step 4/4: Generating comprehensive report...', increment: 25 });
            SWLogger.log('Generating comprehensive report...');

            const report = await llmService.generateComprehensiveReport(
                lastAnalysisContext!,
                lastCodeAnalysis || undefined,
                lastEnhancedProductDocs || undefined,
                lastLLMInsights || undefined,
                cancellationToken
            );

            if (cancellationToken.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Save report to file
            progress.report({ message: 'Saving report...', increment: 0 });
            const shadowDir = path.join(workspaceRoot, '.shadow');
            const docsDir = path.join(shadowDir, 'docs');
            
            if (!fs.existsSync(shadowDir)) {
                fs.mkdirSync(shadowDir, { recursive: true });
            }
            if (!fs.existsSync(docsDir)) {
                fs.mkdirSync(docsDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportPath = path.join(docsDir, `refactoring-report-${timestamp}.md`);
            fs.writeFileSync(reportPath, report, 'utf-8');

            SWLogger.log(`Report saved to: ${reportPath}`);

            // Track report path in tree provider
            if (treeProvider) {
                treeProvider.setReportPath(reportPath);
            }

            // Open the report in VSCode
            const reportUri = vscode.Uri.file(reportPath);
            const document = await vscode.workspace.openTextDocument(reportUri);
            await vscode.window.showTextDocument(document, vscode.ViewColumn.One);

            vscode.window.showInformationMessage(
                `✅ Comprehensive analysis complete! Report opened in editor.`
            );

        } catch (error: any) {
            if (error.message === 'Cancelled by user') {
                vscode.window.showInformationMessage('Analysis cancelled by user');
            } else {
                const errorMessage = error.message || String(error);
                SWLogger.log(`ERROR: Comprehensive analysis failed: ${errorMessage}`);
                vscode.window.showErrorMessage(`Failed to complete analysis: ${errorMessage}`);
            }
        } finally {
            // Reset statuses
            if (treeProvider) {
                treeProvider.setProductDocsStatus('complete');
                treeProvider.setInsightsStatus('complete');
            }
            SWLogger.log('Analysis workflow complete');
        }
    });
}

