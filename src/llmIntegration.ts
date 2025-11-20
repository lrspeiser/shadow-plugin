/**
 * Integration functions for LLM-powered features
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
import { LLMService, AnalysisContext, LLMInsights } from './llmService';
import { InsightsTreeProvider } from './insightsTreeView';
import { EnhancedProductDocumentation } from './fileDocumentation';
import { CodeAnalysis, EntryPoint } from './analyzer';
import { ProductNavigatorProvider } from './productNavigator';
import { AnalysisViewerProvider } from './analysisViewer';
import { InsightsViewerProvider } from './insightsViewer';
import { UnitTestsNavigatorProvider } from './unitTestsNavigator';
import { SWLogger } from './logger';
import { getStateManager } from './state/llmStateManager';
import { convertCodeAnalysisToContext, saveCodeAnalysis, loadSavedCodeAnalysis as loadSavedCodeAnalysisFromFile } from './context/analysisContextBuilder';
import { DocumentationFormatter } from './domain/formatters/documentationFormatter';
import { AnalysisResultRepository } from './infrastructure/persistence/analysisResultRepository';

// Use state manager for all state
const stateManager = getStateManager();
const documentationFormatter = new DocumentationFormatter();
const analysisResultRepository = new AnalysisResultRepository();

export function initializeLLMService() {
    const llmService = new LLMService();
    stateManager.setLLMService(llmService);
    
    // Create output channel for documentation
    stateManager.getOutputChannel();
    SWLogger.section('Extension Init');
    
    // Refresh tree view when API key configuration changes
    llmService.setOnConfigurationChange(() => {
        const treeProvider = stateManager.getTreeProvider();
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
                const insights = JSON.parse(insightsContent) as LLMInsights;
                stateManager.setLLMInsights(insights);
                console.log(`Loaded architecture insights from latest run: ${latestRun.name}`);
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
                const docs = JSON.parse(docsContent) as EnhancedProductDocumentation;
                stateManager.setEnhancedProductDocs(docs);
                console.log(`✅ Loaded enhanced product documentation from latest run: ${latestRun.name}`);
                console.log(`   Path: ${docsPath}`);
                SWLogger.log(`Loaded product docs from ${docsPath}`);
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
    stateManager.setTreeProvider(provider);
}

export function setProductNavigator(provider: ProductNavigatorProvider) {
    stateManager.setProductNavigator(provider);
}

export function setUnitTestsNavigator(provider: UnitTestsNavigatorProvider) {
    stateManager.setUnitTestsNavigator(provider);
}

export function setInsightsViewer(provider: InsightsViewerProvider) {
    stateManager.setInsightsViewer(provider);
}

export function setAnalysisViewer(provider: AnalysisViewerProvider) {
    stateManager.setAnalysisViewer(provider);
}

export function setReportsTreeProvider(provider: any) {
    stateManager.setReportsTreeProvider(provider);
}

export function setCodeAnalysis(analysis: CodeAnalysis) {
    stateManager.setCodeAnalysis(analysis);
    // Convert CodeAnalysis to AnalysisContext and save it
    const context = convertCodeAnalysisToContext(analysis);
    stateManager.setAnalysisContext(context);
    // Save analysis data for future use
    saveCodeAnalysis(analysis);
}

export function setAnalysisContext(context: AnalysisContext) {
    stateManager.setAnalysisContext(context);
}

/**
 * Load saved code analysis on startup and update state
 */
export async function loadSavedCodeAnalysis(): Promise<void> {
    const analysis = await loadSavedCodeAnalysisFromFile();
    if (analysis) {
        stateManager.setCodeAnalysis(analysis);
        const context = convertCodeAnalysisToContext(analysis);
        stateManager.setAnalysisContext(context);
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
    const llmService = stateManager.getLLMService();
    const provider = llmService.getProvider();
    const isClaude = provider === 'claude';
    const wasConfigured = llmService.isConfigured();
    const success = await llmService.promptForApiKey();
    if (success) {
        // Refresh tree view to update button label
        const treeProvider = stateManager.getTreeProvider();
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
    const llmService = stateManager.getLLMService();
    const wasConfigured = llmService.isConfigured();
    const success = await llmService.promptForClaudeApiKey();
    if (success) {
        // Refresh tree view to update button label
        const treeProvider = stateManager.getTreeProvider();
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
    const llmService = stateManager.getLLMService();
    const treeProvider = stateManager.getTreeProvider();
    
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

    const lastAnalysisContext = stateManager.getAnalysisContext();
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

    const lastCodeAnalysis = stateManager.getCodeAnalysis();
    if (!lastCodeAnalysis) {
        vscode.window.showErrorMessage('Please run "Analyze Workspace" first to get code analysis');
        return;
    }

    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const { progressService } = await import('./infrastructure/progressService');
    
    await progressService.withProgress('Generating Enhanced Product Documentation with AI...', async (reporter) => {
        try {
            // Reset run context for new generation
            analysisResultRepository.resetProductDocsRun();
            
            reporter.report('Step 1/3: Analyzing files individually...');
            SWLogger.log('Step 1/3: analyzing files...');
            
            // Use enhanced documentation generation with incremental save callbacks
            const productDocs = await llmService.generateEnhancedProductDocs(
                lastCodeAnalysis,
                workspaceRoot,
                {
                    onFileStart: (filePath, index, total) => {
                        // Update progress notification to show which file is being submitted to LLM
                        reporter.report(`Step 1/3: Submitting file ${index}/${total} to LLM: ${path.basename(filePath)}`);
                        SWLogger.log(`Submitting file ${index}/${total} to LLM: ${filePath}`);
                    },
                    onFileSummary: (summary, index, total) => {
                        analysisResultRepository.saveIncrementalFileSummary(summary, workspaceRoot, index, total);
                        // Update progress notification to show which file was received from LLM
                        reporter.report(`Step 1/3: Received file ${index}/${total} from LLM: ${path.basename(summary.file)}`);
                        SWLogger.log(`Received file ${index}/${total} from LLM: ${summary.file}`);
                        // Refresh product navigator to show new files
                        const productNavigator = stateManager.getProductNavigator();
                        if (productNavigator) {
                            productNavigator.refresh();
                        }
                    },
                    onModuleSummary: (summary, index, total) => {
                        analysisResultRepository.saveIncrementalModuleSummary(summary, workspaceRoot, index, total);
                        // Update progress notification to show incremental progress
                        reporter.report(`Step 2/3: Generating module summaries (${index}/${total}): ${path.basename(summary.module)}`);
                        // Refresh product navigator to show new files
                        const productNavigator = stateManager.getProductNavigator();
                        if (productNavigator) {
                            productNavigator.refresh();
                        }
                    },
                    onProductDocIteration: (doc, iteration, maxIterations) => {
                        analysisResultRepository.saveIncrementalProductDocIteration(doc, workspaceRoot, iteration, maxIterations);
                        // Update progress notification to show incremental progress
                        reporter.report(`Step 3/3: Generating product documentation (iteration ${iteration}/${maxIterations})`);
                        // Refresh product navigator to show new files
                        const productNavigator = stateManager.getProductNavigator();
                        if (productNavigator) {
                            productNavigator.refresh();
                        }
                    }
                }
            );
            
            // Update state and UI
            stateManager.setEnhancedProductDocs(productDocs);
            
            // Update UI to show complete status
            if (treeProvider) {
                treeProvider.setProductDocsStatus('complete');
            }
            SWLogger.log('Status: complete');
            
            reporter.report('Step 2/3: Saving documentation...');
            
            // Save enhanced docs to .shadow folder
            await analysisResultRepository.saveEnhancedProductDocs(productDocs, workspaceRoot);
            SWLogger.log('Saved docs to .shadow/docs');
            
            reporter.report('Step 3/3: Complete');
            
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
    const llmService = stateManager.getLLMService();
    const treeProvider = stateManager.getTreeProvider();
    
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
    let lastAnalysisContext = stateManager.getAnalysisContext();
    if (!lastAnalysisContext) {
        // Try to load saved analysis one more time
        await loadSavedCodeAnalysis();
        lastAnalysisContext = stateManager.getAnalysisContext();
        if (!lastAnalysisContext) {
            vscode.window.showErrorMessage('Please run "Analyze Workspace" first');
            return;
        }
    }

    // Check if product docs are available (recommended but not required)
    let lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
    if (!lastEnhancedProductDocs) {
        // Try to load saved docs one more time
        await loadSavedProductDocs();
        lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
        const result = await vscode.window.showWarningMessage(
            'Product documentation not generated yet. Architecture insights will be more accurate with product docs. Generate them now?',
            'Generate Product Docs First',
            'Continue Without Docs'
        );
        
        if (result === 'Generate Product Docs First') {
            await generateProductDocs();
            // If generation was successful, continue with insights
            lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
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

    const { progressService } = await import('./infrastructure/progressService');
    
    await progressService.withProgress('Generating Architecture Insights with AI...', async (reporter) => {
        try {
            if (!lastAnalysisContext) {
                throw new Error('No analysis context available. Please run workspace analysis first.');
            }

            const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const lastCodeAnalysis = stateManager.getCodeAnalysis();
            const outputChannel = stateManager.getOutputChannel();
            
            reporter.report('Step 1/2: Analyzing product purpose and architecture rationale...');
            console.log('Starting architecture insights generation...');
            console.log('Analysis context:', {
                totalFiles: lastAnalysisContext.totalFiles,
                totalLines: lastAnalysisContext.totalLines,
                entryPoints: lastAnalysisContext.entryPoints.length,
                hasProductDocs: !!lastEnhancedProductDocs
            });
            
            // Log to output channel
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
            
            // Reset run context for new generation
            analysisResultRepository.resetArchitectureInsightsRun();
            
            // Generate insights using both analysis and product docs
            // This now does: Step 1) Analyze product purpose, Step 2) Generate contextual recommendations
            reporter.report('Step 2/2: Generating contextual architecture recommendations...');
            const insights = await llmService.generateArchitectureInsights(
                lastAnalysisContext,
                lastCodeAnalysis || undefined,
                lastEnhancedProductDocs || undefined,
                {
                    onProductPurposeStart: () => {
                        // Update progress notification to show product purpose is being submitted
                        reporter.report('Step 1/2: Submitting product purpose analysis to LLM...');
                        SWLogger.log('Submitting product purpose analysis to LLM');
                    },
                    onProductPurposeAnalysis: (productPurpose) => {
                        analysisResultRepository.saveIncrementalProductPurposeAnalysis(productPurpose, workspaceRoot);
                        // Update progress notification to show product purpose analysis received
                        reporter.report('Step 1/2: Received product purpose analysis from LLM');
                        SWLogger.log('Received product purpose analysis from LLM');
                        // Refresh insights viewer to show incremental data
                        const insightsViewer = stateManager.getInsightsViewer();
                        if (insightsViewer) {
                            insightsViewer.refresh();
                        }
                    },
                    onInsightsIterationStart: (iteration, maxIterations) => {
                        // Update progress notification to show iteration is being submitted
                        reporter.report(`Step 2/2: Submitting architecture insights iteration ${iteration}/${maxIterations} to LLM...`);
                        SWLogger.log(`Submitting architecture insights iteration ${iteration}/${maxIterations} to LLM`);
                    },
                    onInsightsIteration: (insights, iteration, maxIterations) => {
                        console.log('[llmIntegration] onInsightsIteration callback called:', {
                            iteration,
                            maxIterations,
                            hasInsights: !!insights,
                            insightsKeys: insights ? Object.keys(insights) : []
                        });
                        
                        analysisResultRepository.saveIncrementalArchitectureInsightsIteration(insights, workspaceRoot, iteration, maxIterations);
                        
                        // Update progress notification to show iteration was received
                        reporter.report(`Step 2/2: Received architecture insights iteration ${iteration}/${maxIterations} from LLM`);
                        SWLogger.log(`Received architecture insights iteration ${iteration}/${maxIterations} from LLM`);
                        
                        // Refresh insights viewer to show incremental data
                        const insightsViewer = stateManager.getInsightsViewer();
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
            
            // Update state
            stateManager.setLLMInsights(insights);
            
            // Debug: Log insights to console and output channel
            console.log('Generated LLM Insights object:', {
                hasRawContent: !!insights.rawContent,
                rawContentLength: insights.rawContent?.length || 0,
                hasOverall: !!insights.overallAssessment,
                strengthsCount: insights.strengths?.length || 0,
                issuesCount: insights.issues?.length || 0
            });
            console.log('Full LLM Insights JSON:', JSON.stringify(insights, null, 2));
            
            // Log to output channel
            outputChannel.appendLine(`✅ API Response received`);
            outputChannel.appendLine(`📏 Raw content length: ${insights.rawContent?.length || 0} characters`);
            if (insights.rawContent && insights.rawContent.length > 0) {
                outputChannel.appendLine('📄 Raw response (first 500 chars):');
                outputChannel.appendLine(insights.rawContent.substring(0, 500));
                outputChannel.appendLine('');
                outputChannel.appendLine('📊 Parsing results:');
                outputChannel.appendLine(`  - Overall Assessment: ${insights.overallAssessment ? '✅ Found' : '❌ Missing'}`);
                outputChannel.appendLine(`  - Strengths: ${insights.strengths?.length || 0} items`);
                outputChannel.appendLine(`  - Issues: ${insights.issues?.length || 0} items`);
                outputChannel.appendLine(`  - Organization: ${insights.organization ? '✅ Found' : '❌ Missing'}`);
                outputChannel.appendLine(`  - Recommendations: ${insights.recommendations?.length || 0} items`);
            } else {
                outputChannel.appendLine('❌ ERROR: Raw content is empty!');
                outputChannel.appendLine('This suggests the API call returned no content.');
            }
            
            // Check if insights are empty
            const hasInsights = insights.overallAssessment || 
                               (insights.strengths && insights.strengths.length > 0) ||
                               (insights.issues && insights.issues.length > 0) ||
                               insights.organization ||
                               insights.folderReorganization ||
                               (insights.recommendations && insights.recommendations.length > 0) ||
                               (insights.priorities && insights.priorities.length > 0);
            
            if (!hasInsights) {
                const hasRawContent = insights.rawContent && insights.rawContent.length > 0;
                if (hasRawContent) {
                    vscode.window.showWarningMessage('⚠️ LLM insights parsing failed, but raw response is available. Check the output channel.');
                    console.warn('Parsing failed but raw content exists:', insights.rawContent?.substring(0, 500) || '');
                } else {
                    vscode.window.showErrorMessage('❌ LLM returned empty response. Check console for API error details.');
                    console.error('Both parsed insights and raw content are empty!');
                }
            }
            
            reporter.report('Saving insights...');
            
            // Save to .shadow folder in project
            await analysisResultRepository.saveArchitectureInsights(insights);
            SWLogger.log('Saved insights to .shadow/docs');
            
            // Update tree view with LLM insights
            if (treeProvider) {
                treeProvider.setLLMInsights(insights);
                treeProvider.setInsightsStatus('complete');
                console.log('Set LLM insights on tree provider');
                // Force refresh to ensure UI updates
                treeProvider.refresh();
            } else {
                console.warn('Tree provider is null!');
            }
            SWLogger.log('Status: complete');

            
            reporter.report('Displaying insights...');
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
            const outputChannel = stateManager.getOutputChannel();
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
    const lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
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
    const lastLLMInsights = stateManager.getLLMInsights();
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
// All persistence logic moved to AnalysisResultRepository

// Legacy formatDocsAsMarkdown removed - using enhanced docs only

async function showProductDocsInOutput(): Promise<void> {
    const lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
    const outputChannel = stateManager.getOutputChannel();
    
    if (!lastEnhancedProductDocs) {
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


async function showArchitectureInsightsInOutput(): Promise<void> {
    const lastLLMInsights = stateManager.getLLMInsights();
    const outputChannel = stateManager.getOutputChannel();
    
    if (!lastLLMInsights) {
        return;
    }

    const channel = outputChannel;
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
    stateManager.clearAll();

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
                    
                    // Delete product-docs-* directories
                    if (file.startsWith('product-docs-') && fs.statSync(path.join(docsDir, file)).isDirectory()) {
                        const dirPath = path.join(docsDir, file);
                        try {
                            fs.rmSync(dirPath, { recursive: true, force: true });
                            console.log(`Deleted product docs directory: ${file}`);
                        } catch (dirError) {
                            console.error(`Error deleting product docs directory ${file}:`, dirError);
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
    const treeProvider = stateManager.getTreeProvider();
    if (treeProvider) {
        treeProvider.clear();
        treeProvider.setProductDocsStatus('idle');
        treeProvider.setInsightsStatus('idle');
        // Note: setAnalysisComplete() doesn't take parameters, and clear() should reset analysis status
        treeProvider.refresh();
    }

    // Clear product navigator (clears both productDocs and incrementalFiles)
    const productNavigator = stateManager.getProductNavigator();
    if (productNavigator) {
        productNavigator.clearState();
    }

    // Clear insights viewer
    const insightsViewer = stateManager.getInsightsViewer();
    if (insightsViewer) {
        insightsViewer.setInsights(null);
    }

    // Clear analysis viewer
    const analysisViewer = stateManager.getAnalysisViewer();
    if (analysisViewer) {
        analysisViewer.setAnalysis(null);
    }

    // Clear unit tests navigator
    const unitTestsNavigator = stateManager.getUnitTestsNavigator();
    if (unitTestsNavigator) {
        unitTestsNavigator.setUnitTestPlan(null);
        unitTestsNavigator.refresh();
    }

    // Clear output channel
    const outputChannel = stateManager.getOutputChannel();
    outputChannel.clear();
}


/**
 * Extract test code from unit test plan and write actual test files
 */
async function writeTestFilesFromPlan(
    plan: any,
    workspaceRoot: string
): Promise<string[]> {
    const writtenFiles: string[] = [];
    
    if (!plan.aggregated_plan || !plan.aggregated_plan.test_suites) {
        SWLogger.log('No test suites found in plan');
        return writtenFiles;
    }

    // Group test cases by test_file_path
    const testFilesMap = new Map<string, { suite: any; testCases: any[] }[]>();
    
    for (const suite of plan.aggregated_plan.test_suites) {
        if (!suite.test_file_path || !suite.test_cases || suite.test_cases.length === 0) {
            continue;
        }
        
        const testFilePath = suite.test_file_path;
        if (!testFilesMap.has(testFilePath)) {
            testFilesMap.set(testFilePath, []);
        }
        
        testFilesMap.get(testFilePath)!.push({
            suite,
            testCases: suite.test_cases.filter((tc: any) => tc.test_code && tc.test_code.trim().length > 0)
        });
    }

    // Write each test file
    for (const [testFilePath, suites] of testFilesMap.entries()) {
        try {
            // Resolve the test file path relative to workspace root
            // If path starts with / or is absolute, use as-is, otherwise join with workspace root
            let fullTestPath: string;
            if (path.isAbsolute(testFilePath)) {
                fullTestPath = testFilePath;
            } else if (testFilePath.startsWith('UnitTests/') || testFilePath.startsWith('UnitTests\\')) {
                // If it's already in UnitTests, use it directly
                fullTestPath = path.join(workspaceRoot, testFilePath);
            } else {
                // Otherwise, put it in UnitTests folder
                const fileName = path.basename(testFilePath);
                fullTestPath = path.join(workspaceRoot, 'UnitTests', fileName);
            }
            
            // Ensure directory exists
            const testDir = path.dirname(fullTestPath);
            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir, { recursive: true });
            }
            
            // Combine all test code from all suites for this file
            // Since we're using structured outputs, test_code should already be clean
            const testCodeParts: string[] = [];
            const seenImports = new Set<string>();
            const seenMocks = new Set<string>();
            const seenTestNames = new Set<string>();
            
            // First pass: Extract all imports and mocks from all test cases
            for (const { suite, testCases } of suites) {
                if (testCases.length === 0) continue;
                
                for (const testCase of testCases) {
                    if (!testCase.test_code) continue;
                    
                    const lines = testCase.test_code.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Collect import statements
                        if (trimmed.startsWith('import ') || 
                            trimmed.startsWith('require(') || 
                            trimmed.startsWith('using ') ||
                            trimmed.startsWith('#include')) {
                            if (!seenImports.has(trimmed)) {
                                testCodeParts.push(line);
                                seenImports.add(trimmed);
                            }
                        }
                        // Collect jest.mock() statements
                        else if (trimmed.startsWith('jest.mock(') || 
                                 trimmed.startsWith('vi.mock(') ||
                                 trimmed.startsWith('mockito.when(')) {
                            if (!seenMocks.has(trimmed)) {
                                testCodeParts.push(line);
                                seenMocks.add(trimmed);
                            }
                        }
                    }
                }
            }
            
            // Second pass: Add test code from each test case, stripping imports and mocks
            for (const { suite, testCases } of suites) {
                if (testCases.length === 0) continue;
                
                for (const testCase of testCases) {
                    if (!testCase.test_code || !testCase.test_code.trim()) {
                        continue;
                    }
                    
                    // Structured outputs should give us clean code, but do minimal safety cleaning
                    let code = testCase.test_code.trim();
                    
                    // Safety: Remove any markdown code blocks that might have slipped through
                    code = code.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
                    
                    // Strip import statements and jest.mock() calls from test code blocks
                    // since we've already collected them at the top
                    const lines = code.split('\n');
                    const filteredLines: string[] = [];
                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Skip import statements
                        if (trimmed.startsWith('import ') || 
                            trimmed.startsWith('require(') || 
                            trimmed.startsWith('using ') ||
                            trimmed.startsWith('#include')) {
                            continue;
                        }
                        // Skip jest.mock() and other mock statements
                        if (trimmed.startsWith('jest.mock(') || 
                            trimmed.startsWith('vi.mock(') ||
                            trimmed.startsWith('mockito.when(')) {
                            continue;
                        }
                        // Keep everything else
                        filteredLines.push(line);
                    }
                    
                    code = filteredLines.join('\n').trim();
                    
                    if (code.length > 0) {
                        // Check for duplicate test names and add comment if needed
                        const testNameMatch = code.match(/(?:test|it|describe|TEST)\s*\(?\s*['"`]([^'"`]+)['"`]/);
                        if (testNameMatch) {
                            const testName = testNameMatch[1];
                            if (seenTestNames.has(testName)) {
                                code = `// Note: Test name "${testName}" may be duplicated\n${code}`;
                            } else {
                                seenTestNames.add(testName);
                            }
                        }
                        
                        testCodeParts.push('');
                        testCodeParts.push(`// Test: ${testCase.name || testCase.id}`);
                        if (testCase.description) {
                            testCodeParts.push(`// ${testCase.description}`);
                        }
                        testCodeParts.push(code);
                    }
                }
            }
            
            if (testCodeParts.length === 0) {
                SWLogger.log(`No test code found for ${testFilePath}, skipping`);
                continue;
            }
            
            // Combine all parts with proper spacing
            const finalTestCode = testCodeParts
                .filter(part => part.trim().length > 0 || part === '')
                .join('\n')
                .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
                .trim() + '\n';
            
            // Write the file
            fs.writeFileSync(fullTestPath, finalTestCode, 'utf-8');
            writtenFiles.push(path.relative(workspaceRoot, fullTestPath));
            SWLogger.log(`Written test file: ${fullTestPath}`);
            
        } catch (error: any) {
            SWLogger.log(`ERROR: Failed to write test file ${testFilePath}: ${error.message}`);
            console.error(`Error writing test file ${testFilePath}:`, error);
        }
    }
    
    return writtenFiles;
}

/**
 * New 4-phase LLM-based test generation system
 * Phase 1: Setup - Detect environment and configure test framework
 * Phase 2: Planning - Analyze functions and create prioritized test plan
 * Phase 3: Generation - Generate tests incrementally in small batches
 * Phase 4: Validation - Run tests and auto-fix failures with LLM
 */
export async function generateUnitTests(): Promise<void> {
    const llmService = stateManager.getLLMService();
    const treeProvider = stateManager.getTreeProvider();
    
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
    let lastAnalysisContext = stateManager.getAnalysisContext();
    if (!lastAnalysisContext) {
        await loadSavedCodeAnalysis();
        lastAnalysisContext = stateManager.getAnalysisContext();
        if (!lastAnalysisContext) {
            vscode.window.showErrorMessage('Please run "Analyze Workspace" first');
            return;
        }
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

    // Load product docs and architecture insights
    let lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
    if (!lastEnhancedProductDocs) {
        await loadSavedProductDocs();
        lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
    }
    let lastLLMInsights = stateManager.getLLMInsights();
    if (!lastLLMInsights) {
        await loadSavedInsights();
        lastLLMInsights = stateManager.getLLMInsights();
    }

    SWLogger.section('Generate Unit Tests (4-Phase System)');
    SWLogger.log(`Workspace: ${workspaceRoot}`);

    // Update UI
    if (treeProvider) {
        treeProvider.setUnitTestStatus('generating');
    }

    const { progressService } = await import('./infrastructure/progressService');
    
    // Import new test services
    const { LLMTestSetupService } = await import('./domain/services/testing/llmTestSetupService');
    const { LLMTestPlanningService } = await import('./domain/services/testing/llmTestPlanningService');
    const { LLMTestGenerationService } = await import('./domain/services/testing/llmTestGenerationService');
    const { LLMTestValidationService } = await import('./domain/services/testing/llmTestValidationService');
    
    await progressService.withProgress('Generating Unit Tests with AI (4-Phase System)...', async (reporter) => {
        try {
            // PHASE 1: TEST SETUP
            reporter.report('Phase 1/4: Detecting test environment...');
            SWLogger.log('[Phase 1] Detecting test environment...');
            
            const testEnv = LLMTestSetupService.detectTestEnvironment(workspaceRoot);
            SWLogger.log(`[Phase 1] Language: ${testEnv.primaryLanguage}, Framework: ${testEnv.existingTestFramework || 'none'}`);
            
            // Check if setup is needed
            if (!testEnv.hasJestConfig || testEnv.missingDependencies.length > 0) {
                reporter.report('Phase 1/4: Generating test setup plan...');
                const setupPlan = await LLMTestSetupService.generateSetupPlan(workspaceRoot, llmService);
                
                // Ask user for confirmation
                const setupConfirm = await vscode.window.showInformationMessage(
                    `Setup test environment? Will install ${setupPlan.dependencies.length} dependencies and create ${setupPlan.config_files.length} config files.`,
                    'Yes', 'Skip'
                );
                
                if (setupConfirm === 'Yes') {
                    reporter.report('Phase 1/4: Setting up test environment...');
                    const setupResult = await LLMTestSetupService.executeSetup(workspaceRoot, setupPlan);
                    
                    if (setupResult.success) {
                        SWLogger.log(`[Phase 1] Setup complete: ${setupResult.filesCreated.length} files created`);
                    } else {
                        throw new Error(`Setup failed: ${setupResult.message}`);
                    }
                }
            } else {
                SWLogger.log('[Phase 1] Test environment already configured');
            }
            
            // PHASE 2: TEST PLANNING
            reporter.report('Phase 2/4: Creating test plan...');
            SWLogger.log('[Phase 2] Analyzing functions and creating test plan...');
            
            const lastCodeAnalysis = stateManager.getCodeAnalysis();
            const functions = LLMTestPlanningService.analyzeFunctions(lastCodeAnalysis);
            
            if (functions.length === 0) {
                throw new Error('No functions found to test. Please run workspace analysis first.');
            }
            
            const testPlan = await LLMTestPlanningService.createTestPlan(
                lastAnalysisContext,
                functions,
                llmService,
                lastEnhancedProductDocs,
                lastLLMInsights
            );
            
            await LLMTestPlanningService.saveTestPlan(workspaceRoot, testPlan);
            SWLogger.log(`[Phase 2] Test plan created with ${testPlan.testable_functions} testable functions in ${testPlan.function_groups.length} groups`);
            
            // PHASE 3: TEST GENERATION
            reporter.report('Phase 3/4: Generating tests...');
            SWLogger.log('[Phase 3] Generating tests incrementally...');
            
            const prioritizedFunctions = LLMTestPlanningService.getPrioritizedFunctions(testPlan);
            const batchSize = 5; // Generate 5 tests at a time
            const maxFunctions = Math.min(30, prioritizedFunctions.length); // Limit to 30 for first run
            const functionsToTest = prioritizedFunctions.slice(0, maxFunctions);
            
            SWLogger.log(`[Phase 3] Will generate tests for ${functionsToTest.length} functions`);
            
            let generatedCount = 0;
            const testFiles: string[] = [];
            
            // Process in batches
            for (let i = 0; i < functionsToTest.length; i += batchSize) {
                const batch = functionsToTest.slice(i, Math.min(i + batchSize, functionsToTest.length));
                
                reporter.report(`Phase 3/4: Generating tests (${generatedCount}/${functionsToTest.length})...`);
                
                const testResults = await LLMTestGenerationService.generateTestBatch(
                    batch,
                    workspaceRoot,
                    llmService,
                    (current, total, funcName) => {
                        SWLogger.log(`[Phase 3] Generated test ${current}/${total}: ${funcName}`);
                    }
                );
                
                // Write test files
                for (const [funcName, testResult] of testResults.entries()) {
                    const testFilePath = await LLMTestGenerationService.writeTestFile(testResult, workspaceRoot);
                    testFiles.push(testFilePath);
                    
                    // Validate syntax
                    const syntaxCheck = await LLMTestGenerationService.validateSyntax(testFilePath, workspaceRoot);
                    if (!syntaxCheck.valid) {
                        SWLogger.log(`[Phase 3] Syntax error in ${testFilePath}, attempting fix...`);
                        const fixResult = await LLMTestGenerationService.fixSyntaxError(
                            testFilePath,
                            syntaxCheck.error || 'Unknown syntax error',
                            workspaceRoot,
                            llmService
                        );
                        if (fixResult.success) {
                            SWLogger.log(`[Phase 3] Fixed syntax error in ${testFilePath}`);
                        }
                    }
                    
                    generatedCount++;
                }
            }
            
            SWLogger.log(`[Phase 3] Generated ${testFiles.length} test files`);
            
            // PHASE 4: TEST VALIDATION
            reporter.report('Phase 4/4: Running tests and validating...');
            SWLogger.log('[Phase 4] Running all generated tests...');
            
            const testResults = await LLMTestValidationService.runTests(workspaceRoot);
            
            // Auto-fix failing tests (up to 3 attempts each)
            const failingTests = testResults.filter(r => r.status !== 'pass');
            if (failingTests.length > 0) {
                SWLogger.log(`[Phase 4] Found ${failingTests.length} failing tests, attempting fixes...`);
                
                for (const failedTest of failingTests.slice(0, 5)) { // Limit to 5 fixes for time
                    reporter.report(`Phase 4/4: Fixing ${failedTest.test_file}...`);
                    const fixResult = await LLMTestValidationService.fixFailingTest(
                        failedTest.test_file,
                        failedTest,
                        workspaceRoot,
                        llmService,
                        3 // Max 3 attempts
                    );
                    
                    if (fixResult.success) {
                        SWLogger.log(`[Phase 4] Fixed ${failedTest.test_file} in ${fixResult.attempts} attempt(s)`);
                    } else {
                        SWLogger.log(`[Phase 4] Could not fix ${failedTest.test_file}: ${fixResult.finalError}`);
                    }
                }
                
                // Re-run tests after fixes
                const finalResults = await LLMTestValidationService.runTests(workspaceRoot);
                await LLMTestValidationService.generateTestReport(workspaceRoot, finalResults);
            } else {
                await LLMTestValidationService.generateTestReport(workspaceRoot, testResults);
            }
            
            // Show summary
            const totalTests = testResults.reduce((sum, r) => sum + r.passed + r.failed, 0);
            const passed = testResults.reduce((sum, r) => sum + r.passed, 0);
            const passRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;
            
            vscode.window.showInformationMessage(
                `✅ Test generation complete! Generated ${testFiles.length} test files. ` +
                `Tests: ${passed}/${totalTests} passing (${passRate}%). Check Output for details.`
            );
            
            SWLogger.log(`[Complete] ${testFiles.length} test files, ${passed}/${totalTests} tests passing (${passRate}%)`);
            
            if (treeProvider) {
                treeProvider.setUnitTestStatus('complete');
            }
            
        } catch (error: any) {
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
export async function runComprehensiveAnalysis(cancellationToken?: vscode.CancellationToken): Promise<void> {
    const llmService = stateManager.getLLMService();
    const treeProvider = stateManager.getTreeProvider();
    
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

    const { progressService } = await import('./infrastructure/progressService');
    
    await progressService.withProgress('Comprehensive Analysis & Report Generation', async (reporter) => {
        try {
            // Step 1: Ensure workspace analysis is complete
            reporter.report('Step 1/4: Analyzing workspace...', 0);
            
            let lastAnalysisContext = stateManager.getAnalysisContext();
            let lastCodeAnalysis = stateManager.getCodeAnalysis();
            if (!lastAnalysisContext || !lastCodeAnalysis) {
                await loadSavedCodeAnalysis();
                lastAnalysisContext = stateManager.getAnalysisContext();
                lastCodeAnalysis = stateManager.getCodeAnalysis();
                if (!lastAnalysisContext || !lastCodeAnalysis) {
                    throw new Error('Workspace analysis not found. Please run "Analyze Workspace" first.');
                }
            }

            // Step 2: Generate Product Documentation
            reporter.report('Step 2/4: Generating product documentation...', 25);
            
            let lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
            if (!lastEnhancedProductDocs) {
                await loadSavedProductDocs();
                lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
            }
            
            if (!lastEnhancedProductDocs) {
                SWLogger.log('Generating product documentation...');
                if (treeProvider) {
                    treeProvider.setProductDocsStatus('generating');
                }

                const productDocs = await llmService.generateEnhancedProductDocs(
                    lastCodeAnalysis!,
                    workspaceRoot,
                    {
                        onFileStart: (filePath, index, total) => {
                            if (reporter.cancellationToken?.isCancellationRequested) {
                                throw new Error('Cancelled by user');
                            }
                            reporter.report(`Step 2/4: Analyzing file ${index}/${total}: ${path.basename(filePath)}`, 0);
                        },
                        onFileSummary: (summary) => {
                            analysisResultRepository.saveIncrementalFileSummary(summary, workspaceRoot, 0, 0);
                        },
                        onModuleSummary: (summary) => {
                            analysisResultRepository.saveIncrementalModuleSummary(summary, workspaceRoot, 0, 0);
                        },
                        onProductDocIteration: (doc) => {
                            analysisResultRepository.saveIncrementalProductDocIteration(doc, workspaceRoot, 1, 1);
                        }
                    }
                );

                stateManager.setEnhancedProductDocs(productDocs);
                await analysisResultRepository.saveEnhancedProductDocs(productDocs, workspaceRoot);
                
                if (treeProvider) {
                    treeProvider.setProductDocsStatus('complete');
                }
                const productNavigator = stateManager.getProductNavigator();
                if (productNavigator) {
                    productNavigator.setProductDocs(productDocs);
                }
                lastEnhancedProductDocs = productDocs;
            }

            if (reporter.cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Step 3: Generate Architecture Insights
            reporter.report('Step 3/4: Generating architecture insights...', 25);
            
            let lastLLMInsights = stateManager.getLLMInsights();
            if (!lastLLMInsights) {
                await loadSavedInsights();
                lastLLMInsights = stateManager.getLLMInsights();
            }
            
            if (!lastLLMInsights) {
                SWLogger.log('Generating architecture insights...');
                if (treeProvider) {
                    treeProvider.setInsightsStatus('generating');
                }

                // Defensive check to ensure all required data is available
                if (!lastAnalysisContext) {
                    throw new Error('Analysis context is not available. Cannot generate architecture insights.');
                }

                const insights = await llmService.generateArchitectureInsights(
                    lastAnalysisContext,
                    lastCodeAnalysis || undefined,
                    lastEnhancedProductDocs || undefined,
                    {
                        onProductPurposeStart: () => {
                            if (reporter.cancellationToken?.isCancellationRequested) {
                                throw new Error('Cancelled by user');
                            }
                            reporter.report('Step 3/4: Analyzing product purpose...', 0);
                        },
                        onProductPurposeAnalysis: (productPurpose) => {
                            analysisResultRepository.saveIncrementalProductPurposeAnalysis(productPurpose, workspaceRoot);
                        },
                        onInsightsIterationStart: (iteration, maxIterations) => {
                            if (reporter.cancellationToken?.isCancellationRequested) {
                                throw new Error('Cancelled by user');
                            }
                            reporter.report(`Step 3/4: Generating insights (${iteration}/${maxIterations})...`, 0);
                        },
                        onInsightsIteration: (insights) => {
                            analysisResultRepository.saveIncrementalArchitectureInsightsIteration(insights, workspaceRoot, 1, 1);
                            const insightsViewer = stateManager.getInsightsViewer();
                            if (insightsViewer) {
                                insightsViewer.setInsights(insights);
                            }
                        }
                    }
                );

                stateManager.setLLMInsights(insights);
                await analysisResultRepository.saveArchitectureInsights(insights);
                
                if (treeProvider) {
                    treeProvider.setLLMInsights(insights);
                    treeProvider.setInsightsStatus('complete');
                }
                const insightsViewer = stateManager.getInsightsViewer();
                if (insightsViewer) {
                    insightsViewer.setInsights(insights);
                }
                lastLLMInsights = insights;
            }

            if (reporter.cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Step 4: Generate Comprehensive Report
            reporter.report('Step 4/4: Generating comprehensive report...', 25);
            SWLogger.log('Generating comprehensive report...');

            // Defensive check to ensure all required data is available
            if (!lastAnalysisContext) {
                throw new Error('Analysis context is not available. Cannot generate comprehensive report.');
            }

            const report = await llmService.generateComprehensiveReport(
                lastAnalysisContext,
                lastCodeAnalysis || undefined,
                lastEnhancedProductDocs || undefined,
                lastLLMInsights || undefined,
                reporter.cancellationToken
            );

            if (reporter.cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Save report to file
            reporter.report('Saving report...', 0);
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

            // Update Reports viewer (both webview and tree view)
            await refreshReportsViewer();

            vscode.window.showInformationMessage(
                `✅ Comprehensive analysis complete! Refactoring report generated. View it in the Reports pane.`
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

/**
 * Generate workspace analysis report
 */
export async function generateWorkspaceReport(): Promise<void> {
    const llmService = stateManager.getLLMService();
    const treeProvider = stateManager.getTreeProvider();
    
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

    // Load analysis context and code analysis
    let lastAnalysisContext = stateManager.getAnalysisContext();
    if (!lastAnalysisContext) {
        await loadSavedCodeAnalysis();
        lastAnalysisContext = stateManager.getAnalysisContext();
        if (!lastAnalysisContext) {
            vscode.window.showErrorMessage('Please run "Analyze Workspace" first');
            return;
        }
    }

    let lastCodeAnalysis = stateManager.getCodeAnalysis();
    if (!lastCodeAnalysis) {
        const analysis = await loadSavedCodeAnalysisFromFile();
        if (analysis) {
            stateManager.setCodeAnalysis(analysis);
            lastCodeAnalysis = analysis;
        }
    }

    if (!lastCodeAnalysis) {
        vscode.window.showErrorMessage('Please run "Analyze Workspace" first');
        return;
    }

    const { progressService } = await import('./infrastructure/progressService');
    
    await progressService.withProgress('Generating Workspace Report...', async (reporter) => {
        try {
            reporter.report('Generating workspace report with AI...');
            
            const report = await llmService.generateWorkspaceReport(
                lastAnalysisContext!,
                lastCodeAnalysis!,
                reporter.cancellationToken
            );

            if (reporter.cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Save report to file
            const shadowDir = path.join(workspaceRoot, '.shadow');
            const docsDir = path.join(shadowDir, 'docs');
            
            if (!fs.existsSync(shadowDir)) {
                fs.mkdirSync(shadowDir, { recursive: true });
            }
            if (!fs.existsSync(docsDir)) {
                fs.mkdirSync(docsDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportPath = path.join(docsDir, `workspace-report-${timestamp}.md`);
            fs.writeFileSync(reportPath, report, 'utf-8');

            SWLogger.log(`Workspace report saved to: ${reportPath}`);

            // Track report path in tree provider
            if (treeProvider) {
                treeProvider.setWorkspaceReportPath(reportPath);
            }

            // Update Reports viewer (both webview and tree view)
            await refreshReportsViewer();

            vscode.window.showInformationMessage(
                `✅ Workspace report generated! View it in the Reports pane.`
            );

        } catch (error: any) {
            if (error.message === 'Cancelled by user') {
                vscode.window.showInformationMessage('Report generation cancelled by user');
            } else {
                const errorMessage = error.message || String(error);
                SWLogger.log(`ERROR: Workspace report generation failed: ${errorMessage}`);
                vscode.window.showErrorMessage(`Failed to generate workspace report: ${errorMessage}`);
            }
        }
    });
}

/**
 * Generate product documentation report
 */
export async function generateProductReport(): Promise<void> {
    const llmService = stateManager.getLLMService();
    const treeProvider = stateManager.getTreeProvider();
    
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

    // Load product docs
    let lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
    if (!lastEnhancedProductDocs) {
        await loadSavedProductDocs();
        lastEnhancedProductDocs = stateManager.getEnhancedProductDocs();
        if (!lastEnhancedProductDocs) {
            vscode.window.showErrorMessage('Please run "Generate Product Documentation" first');
            return;
        }
    }

    // Load analysis context for additional context
    let lastAnalysisContext = stateManager.getAnalysisContext();
    if (!lastAnalysisContext) {
        await loadSavedCodeAnalysis();
        lastAnalysisContext = stateManager.getAnalysisContext();
    }

    const { progressService } = await import('./infrastructure/progressService');
    
    await progressService.withProgress('Generating Product Report...', async (reporter) => {
        try {
            reporter.report('Generating product report with AI...');
            
            const report = await llmService.generateProductReport(
                lastEnhancedProductDocs!,
                lastAnalysisContext || undefined,
                reporter.cancellationToken
            );

            if (reporter.cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Save report to file
            const shadowDir = path.join(workspaceRoot, '.shadow');
            const docsDir = path.join(shadowDir, 'docs');
            
            if (!fs.existsSync(shadowDir)) {
                fs.mkdirSync(shadowDir, { recursive: true });
            }
            if (!fs.existsSync(docsDir)) {
                fs.mkdirSync(docsDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportPath = path.join(docsDir, `product-report-${timestamp}.md`);
            fs.writeFileSync(reportPath, report, 'utf-8');

            SWLogger.log(`Product report saved to: ${reportPath}`);

            // Track report path in tree provider
            if (treeProvider) {
                treeProvider.setProductReportPath(reportPath);
            }

            // Update Reports viewer (both webview and tree view)
            await refreshReportsViewer();

            vscode.window.showInformationMessage(
                `✅ Product report generated! View it in the Reports pane.`
            );

        } catch (error: any) {
            if (error.message === 'Cancelled by user') {
                vscode.window.showInformationMessage('Report generation cancelled by user');
            } else {
                const errorMessage = error.message || String(error);
                SWLogger.log(`ERROR: Product report generation failed: ${errorMessage}`);
                vscode.window.showErrorMessage(`Failed to generate product report: ${errorMessage}`);
            }
        }
    });
}

/**
 * Generate architecture insights report
 */
export async function generateArchitectureReport(): Promise<void> {
    const llmService = stateManager.getLLMService();
    const treeProvider = stateManager.getTreeProvider();
    
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

    // Load architecture insights
    let lastLLMInsights = stateManager.getLLMInsights();
    if (!lastLLMInsights) {
        await loadSavedInsights();
        lastLLMInsights = stateManager.getLLMInsights();
        if (!lastLLMInsights) {
            vscode.window.showErrorMessage('Please run "Generate AI Architecture Insights" first');
            return;
        }
    }

    // Load analysis context and code analysis for additional context
    let lastAnalysisContext = stateManager.getAnalysisContext();
    if (!lastAnalysisContext) {
        await loadSavedCodeAnalysis();
        lastAnalysisContext = stateManager.getAnalysisContext();
    }

    let lastCodeAnalysis = stateManager.getCodeAnalysis();
    if (!lastCodeAnalysis) {
        const analysis = await loadSavedCodeAnalysisFromFile();
        if (analysis) {
            stateManager.setCodeAnalysis(analysis);
            lastCodeAnalysis = analysis;
        }
    }

    const { progressService } = await import('./infrastructure/progressService');
    
    await progressService.withProgress('Generating Architecture Report...', async (reporter) => {
        try {
            reporter.report('Generating architecture report with AI...');
            
            const report = await llmService.generateArchitectureReport(
                lastLLMInsights!,
                lastAnalysisContext || undefined,
                lastCodeAnalysis || undefined,
                reporter.cancellationToken
            );

            if (reporter.cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Save report to file
            const shadowDir = path.join(workspaceRoot, '.shadow');
            const docsDir = path.join(shadowDir, 'docs');
            
            if (!fs.existsSync(shadowDir)) {
                fs.mkdirSync(shadowDir, { recursive: true });
            }
            if (!fs.existsSync(docsDir)) {
                fs.mkdirSync(docsDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportPath = path.join(docsDir, `architecture-report-${timestamp}.md`);
            fs.writeFileSync(reportPath, report, 'utf-8');

            SWLogger.log(`Architecture report saved to: ${reportPath}`);

            // Track report path in tree provider
            if (treeProvider) {
                treeProvider.setArchitectureReportPath(reportPath);
            }

            // Update Reports viewer (both webview and tree view)
            await refreshReportsViewer();

            vscode.window.showInformationMessage(
                `✅ Architecture report generated! View it in the Reports pane.`
            );

        } catch (error: any) {
            if (error.message === 'Cancelled by user') {
                vscode.window.showInformationMessage('Report generation cancelled by user');
            } else {
                const errorMessage = error.message || String(error);
                SWLogger.log(`ERROR: Architecture report generation failed: ${errorMessage}`);
                vscode.window.showErrorMessage(`Failed to generate architecture report: ${errorMessage}`);
            }
        }
    });
}

/**
 * Run unit tests and generate a report using LLM
 */
/**
 * Refresh the Reports viewer with current report paths from tree provider
 */
async function refreshReportsViewer(): Promise<void> {
    const treeProvider = stateManager.getTreeProvider();
    const reportsViewer = stateManager.getReportsViewer();
    const reportsTreeProvider = stateManager.getReportsTreeProvider();
    
    if (!treeProvider) {
        return;
    }
    
    const reportPaths = treeProvider.getAllReportPaths();
    
    // Update the webview-based reports viewer (if initialized)
    if (reportsViewer) {
        reportsViewer.setReports({
            workspace: { path: reportPaths.workspace.path, timestamp: reportPaths.workspace.timestamp },
            product: { path: reportPaths.product.path, timestamp: reportPaths.product.timestamp },
            architecture: { path: reportPaths.architecture.path, timestamp: reportPaths.architecture.timestamp },
            refactoring: { path: reportPaths.refactoring.path, timestamp: reportPaths.refactoring.timestamp },
            'unit-test': { path: reportPaths.unitTest.path, timestamp: reportPaths.unitTest.timestamp }
        });
    }
    
    // Update the tree view provider (always available)
    if (reportsTreeProvider) {
        reportsTreeProvider.setReports({
            workspace: { path: reportPaths.workspace.path, timestamp: reportPaths.workspace.timestamp },
            product: { path: reportPaths.product.path, timestamp: reportPaths.product.timestamp },
            architecture: { path: reportPaths.architecture.path, timestamp: reportPaths.architecture.timestamp },
            refactoring: { path: reportPaths.refactoring.path, timestamp: reportPaths.refactoring.timestamp },
            'unit-test': { path: reportPaths.unitTest.path, timestamp: reportPaths.unitTest.timestamp }
        });
    }
}

/**
 * Refresh reports on extension startup
 */
export async function refreshReportsOnStartup(): Promise<void> {
    await refreshReportsViewer();
}

/**
 * Show the Reports pane
 */
export async function showReports(): Promise<void> {
    // Refresh reports from tree provider first
    await refreshReportsViewer();
    
    // Focus on the Reports tree view in sidebar
    try {
        await vscode.commands.executeCommand('shadowWatch.reportsViewer.focus');
    } catch (error) {
        // If focus fails, show the old webview as fallback
        const reportsViewer = stateManager.getReportsViewer();
        if (reportsViewer) {
            reportsViewer.show();
        } else {
            vscode.window.showErrorMessage('Reports viewer not initialized');
        }
    }
}

export async function runUnitTests(): Promise<void> {
    const llmService = stateManager.getLLMService();
    const treeProvider = stateManager.getTreeProvider();
    
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    
    // Check both new location (.shadow/UnitTests) and old location (UnitTests) for backward compatibility
    let unitTestPlanPath = path.join(workspaceRoot, '.shadow', 'UnitTests', 'unit_test_plan.json');
    if (!fs.existsSync(unitTestPlanPath)) {
        // Try old location
        const oldPath = path.join(workspaceRoot, 'UnitTests', 'unit_test_plan.json');
        if (fs.existsSync(oldPath)) {
            unitTestPlanPath = oldPath;
            SWLogger.log(`Found unit test plan in old location: ${oldPath}`);
        } else {
            vscode.window.showErrorMessage('Unit test plan not found. Please generate unit tests first.');
            return;
        }
    }

    // Load unit test plan
    let unitTestPlan: any;
    try {
        const planContent = fs.readFileSync(unitTestPlanPath, 'utf-8');
        unitTestPlan = JSON.parse(planContent);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to load unit test plan: ${error.message}`);
        return;
    }

    const testingFramework = unitTestPlan.aggregated_plan?.unit_test_plan?.testing_framework || 'jest';
    const testSuites = unitTestPlan.aggregated_plan?.test_suites || [];

    if (testSuites.length === 0) {
        vscode.window.showErrorMessage('No test suites found in unit test plan');
        return;
    }

    SWLogger.section('Run Unit Tests');
    SWLogger.log('Starting test execution...');

    const { progressService } = await import('./infrastructure/progressService');
    
    await progressService.withProgress('Running Unit Tests...', async (reporter) => {
        try {
            const testResults: any[] = [];
            
            // Run each test suite
            for (let i = 0; i < testSuites.length; i++) {
                const suite = testSuites[i];
                reporter.report(`Running test suite ${i + 1}/${testSuites.length}: ${suite.name || suite.id}`);
                
                // Get test file path
                const testFilePath = suite.test_file_path;
                if (!testFilePath) {
                    SWLogger.log(`Skipping suite ${suite.id}: no test_file_path`);
                    continue;
                }
                
                // Resolve test file path - check both new and old locations
                let fullTestPath: string;
                if (path.isAbsolute(testFilePath)) {
                    fullTestPath = testFilePath;
                } else if (testFilePath.startsWith('.shadow/UnitTests/')) {
                    fullTestPath = path.join(workspaceRoot, testFilePath);
                } else if (testFilePath.startsWith('UnitTests/')) {
                    // Check old location first, then new location
                    const oldPath = path.join(workspaceRoot, testFilePath);
                    const newPath = path.join(workspaceRoot, '.shadow', 'UnitTests', path.basename(testFilePath));
                    if (fs.existsSync(oldPath)) {
                        fullTestPath = oldPath;
                    } else if (fs.existsSync(newPath)) {
                        fullTestPath = newPath;
                    } else {
                        fullTestPath = newPath; // Will be checked below
                    }
                } else {
                    // Try new location first, then old location
                    const newPath = path.join(workspaceRoot, '.shadow', 'UnitTests', path.basename(testFilePath));
                    const oldPath = path.join(workspaceRoot, 'UnitTests', path.basename(testFilePath));
                    if (fs.existsSync(newPath)) {
                        fullTestPath = newPath;
                    } else if (fs.existsSync(oldPath)) {
                        fullTestPath = oldPath;
                    } else {
                        fullTestPath = newPath; // Will be checked below
                    }
                }
                
                if (!fs.existsSync(fullTestPath)) {
                    SWLogger.log(`Test file not found: ${fullTestPath}`);
                    testResults.push({
                        suite: suite.name || suite.id,
                        suiteId: suite.id,
                        testFilePath: testFilePath,
                        status: 'skipped',
                        reason: `Test file not found: ${fullTestPath}`,
                        testCount: 0,
                        passedCount: 0,
                        failedCount: 0,
                        skippedCount: 0,
                        testCases: []
                    });
                    continue;
                }
                
                // Determine test command based on framework
                let testCommand: string;
                if (testingFramework === 'jest') {
                    testCommand = `npx jest "${fullTestPath}" --json --no-coverage`;
                } else if (testingFramework === 'pytest') {
                    testCommand = `pytest "${fullTestPath}" --json-report --json-report-file=-`;
                } else if (testingFramework === 'mocha') {
                    testCommand = `npx mocha "${fullTestPath}" --reporter json`;
                } else if (testingFramework === 'vitest') {
                    testCommand = `npx vitest run "${fullTestPath}" --reporter=json`;
                } else {
                    // Try to use run_suite_instructions from the plan
                    testCommand = suite.run_suite_instructions || `npm test -- "${fullTestPath}"`;
                }
                
                try {
                    SWLogger.log(`Executing: ${testCommand}`);
                    const { stdout, stderr } = await execAsync(testCommand, {
                        cwd: workspaceRoot,
                        timeout: 300000 // 5 minutes timeout
                    });
                    
                    // Parse test results
                    let parsedResults: any;
                    try {
                        parsedResults = JSON.parse(stdout);
                    } catch {
                        // If JSON parsing fails, use raw output
                        parsedResults = {
                            rawOutput: stdout,
                            stderr: stderr
                        };
                    }
                    
                    // Extract more detailed information from parsed results
                    const testCount = parsedResults.numTotalTests || parsedResults.numTests || 0;
                    const passedCount = parsedResults.numPassedTests || parsedResults.numPassingTests || 0;
                    const failedCount = parsedResults.numFailedTests || parsedResults.numFailingTests || 0;
                    const testCases = parsedResults.testResults || parsedResults.results || [];
                    
                    testResults.push({
                        suite: suite.name || suite.id,
                        suiteId: suite.id,
                        testFilePath: testFilePath,
                        status: parsedResults.success !== false && failedCount === 0 ? 'passed' : 'failed',
                        testCount: testCount,
                        passedCount: passedCount,
                        failedCount: failedCount,
                        skippedCount: parsedResults.numPendingTests || parsedResults.numSkippedTests || 0,
                        executionTime: parsedResults.startTime && parsedResults.endTime 
                            ? parsedResults.endTime - parsedResults.startTime 
                            : undefined,
                        results: parsedResults,
                        testCases: testCases.map((tc: any) => ({
                            name: tc.name || tc.title,
                            status: tc.status || (tc.failureMessages && tc.failureMessages.length > 0 ? 'failed' : 'passed'),
                            failureMessages: tc.failureMessages || [],
                            duration: tc.duration
                        })),
                        stdout: stdout,
                        stderr: stderr,
                        warnings: parsedResults.warnings || []
                    });
                    
                } catch (error: any) {
                    SWLogger.log(`Test execution failed for ${suite.name}: ${error.message}`);
                    testResults.push({
                        suite: suite.name || suite.id,
                        suiteId: suite.id,
                        testFilePath: testFilePath,
                        status: 'error',
                        error: error.message,
                        errorCode: error.code,
                        testCount: 0,
                        passedCount: 0,
                        failedCount: 0,
                        skippedCount: 0,
                        stdout: error.stdout || '',
                        stderr: error.stderr || '',
                        testCases: []
                    });
                }
                
                // Check for cancellation
                if (reporter.cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }
            }
            
            // Generate test report using LLM
            reporter.report('Generating test report with AI...');
            const testReport = await generateTestReport(testResults, unitTestPlan, workspaceRoot, reporter.cancellationToken);
            
            // Save report
            const shadowDir = path.join(workspaceRoot, '.shadow');
            const docsDir = path.join(shadowDir, 'docs');
            if (!fs.existsSync(docsDir)) {
                fs.mkdirSync(docsDir, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportPath = path.join(docsDir, `unit-test-report-${timestamp}.md`);
            fs.writeFileSync(reportPath, testReport, 'utf-8');
            
            SWLogger.log(`Test report saved to: ${reportPath}`);
            
            // Track report path in tree provider
            const { getStateManager } = await import('./state/llmStateManager');
            const stateManager = getStateManager();
            const treeProvider = stateManager.getTreeProvider();
            if (treeProvider) {
                treeProvider.setUnitTestReportPath(reportPath);
            }
            
            // Update Reports viewer and show it
            await refreshReportsViewer();
            const reportsViewer = stateManager.getReportsViewer();
            if (reportsViewer) {
                reportsViewer.show();
            }
            
            vscode.window.showInformationMessage(
                `✅ Unit tests completed! Report saved to ${path.relative(workspaceRoot, reportPath)}`
            );
            
        } catch (error: any) {
            if (error.message === 'Cancelled by user') {
                vscode.window.showInformationMessage('Test execution cancelled');
                return;
            }
            const errorMessage = error.message || String(error);
            SWLogger.log(`ERROR: Failed to run unit tests: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to run unit tests: ${errorMessage}`);
        }
    });
}

/**
 * Generate test report from test results using LLM
 */
async function generateTestReport(
    testResults: any[],
    unitTestPlan: any,
    workspaceRoot: string,
    cancellationToken?: vscode.CancellationToken
): Promise<string> {
    const llmService = stateManager.getLLMService();
    
    // Build prompt for test report generation
    const prompt = `You are a test analysis expert. Analyze the following unit test results and generate a comprehensive test report.

## Test Plan Summary
- Testing Framework: ${unitTestPlan.aggregated_plan?.unit_test_plan?.testing_framework || 'unknown'}
- Total Test Suites: ${unitTestPlan.aggregated_plan?.test_suites?.length || 0}
- Test Strategy: ${unitTestPlan.aggregated_plan?.unit_test_plan?.strategy || 'N/A'}
- Mocking Approach: ${unitTestPlan.aggregated_plan?.unit_test_plan?.mocking_approach || 'N/A'}
- Isolation Strategy: ${unitTestPlan.aggregated_plan?.unit_test_plan?.isolation_strategy || 'N/A'}

## Test Execution Summary
- Total Suites Executed: ${testResults.length}
- Passed Suites: ${testResults.filter(r => r.status === 'passed').length}
- Failed Suites: ${testResults.filter(r => r.status === 'failed').length}
- Error Suites: ${testResults.filter(r => r.status === 'error').length}
- Skipped Suites: ${testResults.filter(r => r.status === 'skipped').length}
- Total Tests Executed: ${testResults.reduce((sum, r) => sum + (r.testCount || 0), 0)}
- Total Tests Passed: ${testResults.reduce((sum, r) => sum + (r.passedCount || 0), 0)}
- Total Tests Failed: ${testResults.reduce((sum, r) => sum + (r.failedCount || 0), 0)}

## Detailed Test Results
${JSON.stringify(testResults, null, 2)}

## Test Plan Context
${unitTestPlan.rationale ? `**Rationale:** ${unitTestPlan.rationale.substring(0, 500)}...\n\n` : ''}
${unitTestPlan.aggregated_plan?.test_suites ? `**Test Suites Overview:**\n${unitTestPlan.aggregated_plan.test_suites.slice(0, 5).map((s: any) => `- ${s.name || s.id}: ${s.description || 'No description'}`).join('\n')}\n\n` : ''}

## Your Task
Generate a comprehensive test report in markdown format that includes:

1. **Executive Summary**: 
   - Overall test status with clear pass/fail indicators (✅/❌)
   - Total test suites, tests executed, pass/fail/skip counts
   - Success rate percentage
   - Critical issues summary (if any)
   - Table format for key metrics

2. **Root Cause Analysis** (if failures exist):
   - Identify the PRIMARY root cause(s) of failures
   - Analyze error patterns across test suites
   - Distinguish between configuration issues vs. code issues
   - Identify systemic problems (affecting multiple suites) vs. isolated issues
   - Document technical root causes with specific error examples

3. **Detailed Test Suite Results**: For each suite, document:
   - Suite name and test file path
   - Status (passed/failed/error/skipped) with clear indicators
   - Number of tests run, passed, failed, skipped
   - Execution time (if available)
   - Individual test case results (for failed tests, show which specific tests failed)
   - Key failures or errors with full error messages
   - Any warnings or issues
   - Test objectives that were supposed to be validated

4. **Pattern Analysis**:
   - Common failure characteristics across suites
   - What worked well (if anything)
   - What failed and why (be specific)
   - Patterns in failures (e.g., all tests in a suite failed, specific function failures, configuration issues)
   - Missing tests or coverage gaps
   - Identify if failures are pre-execution (parsing/compilation) vs. runtime failures

5. **Critical Recommendations** (prioritized):
   - IMMEDIATE ACTION REQUIRED items (blocking issues)
   - How to fix failing tests (with code examples if applicable)
   - Configuration fixes needed (with specific config examples)
   - Tests that should be added
   - Improvements to test quality
   - Areas needing more coverage
   - Estimated time to fix (if possible)

6. **Success Criteria for Next Execution**:
   - Phase 1: Configuration fixes (if needed)
   - Phase 2: Test execution goals
   - Phase 3: Quality validation targets

7. **Conclusion**:
   - Current state summary
   - Blocker status
   - Next steps in priority order

**IMPORTANT**: 
- Be extremely specific and actionable in recommendations
- Include code examples for fixes when possible
- Prioritize recommendations (CRITICAL, HIGH, MEDIUM)
- If all tests failed due to configuration, focus heavily on configuration fixes
- If individual tests failed, provide specific guidance for each
- Use markdown tables, code blocks, and clear formatting
- Be diagnostic - help identify WHY things failed, not just WHAT failed

Format the report as markdown with clear sections and subsections. Be specific and actionable.`;

    try {
        const provider = llmService.getProvider();
        const isClaude = provider === 'claude';
        
        const response = await llmService['retryHandler'].executeWithRetry(
            async () => {
                if (cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }
                
                if (isClaude) {
                    const providerInstance = llmService['providerFactory'].getCurrentProvider();
                    const llmResponse = await providerInstance.sendRequest({
                        model: llmService.getModelForProvider('claude'),
                        messages: [{
                            role: 'user',
                            content: prompt
                        }],
                        systemPrompt: 'You are an expert test analyst who generates comprehensive, actionable test reports.'
                    });
                    return llmResponse.content;
                } else {
                    const openaiProvider = llmService['providerFactory'].getProvider('openai');
                    const llmResponse = await openaiProvider.sendRequest({
                        model: llmService.getModelForProvider('openai'),
                        systemPrompt: 'You are an expert test analyst who generates comprehensive, actionable test reports.',
                        messages: [{
                            role: 'user',
                            content: prompt
                        }],
                    });
                    return llmResponse.content;
                }
            }
        );
        
        return response;
    } catch (error: any) {
        // Fallback to a simple report if LLM fails
        return `# Unit Test Report

Generated: ${new Date().toISOString()}

## Summary
${testResults.filter(r => r.status === 'passed').length} passed, ${testResults.filter(r => r.status === 'failed').length} failed, ${testResults.filter(r => r.status === 'error').length} errors

## Results
${testResults.map(r => `### ${r.suite}
- Status: ${r.status}
${r.error ? `- Error: ${r.error}` : ''}
${r.reason ? `- Reason: ${r.reason}` : ''}
`).join('\n')}

## Note
LLM report generation failed: ${error.message}
`;
    }
}

