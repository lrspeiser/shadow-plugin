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

    // Clear product navigator
    const productNavigator = stateManager.getProductNavigator();
    if (productNavigator) {
        productNavigator.setProductDocs(null);
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
            const seenTestNames = new Set<string>();
            
            for (const { suite, testCases } of suites) {
                if (testCases.length === 0) continue;
                
                // Extract imports from all test cases
                for (const testCase of testCases) {
                    if (!testCase.test_code) continue;
                    
                    const lines = testCase.test_code.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Collect import statements (should be clean from structured output)
                        if (trimmed.startsWith('import ') || 
                            trimmed.startsWith('require(') || 
                            trimmed.startsWith('using ') ||
                            trimmed.startsWith('#include')) {
                            if (!seenImports.has(trimmed)) {
                                testCodeParts.push(line);
                                seenImports.add(trimmed);
                            }
                        }
                    }
                }
                
                // Add test code from each test case
                for (const testCase of testCases) {
                    if (!testCase.test_code || !testCase.test_code.trim()) {
                        continue;
                    }
                    
                    // Structured outputs should give us clean code, but do minimal safety cleaning
                    let code = testCase.test_code.trim();
                    
                    // Safety: Remove any markdown code blocks that might have slipped through
                    code = code.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
                    
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

    // Load product docs and architecture insights from local files
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

    SWLogger.section('Generate Unit Tests');
    SWLogger.log(`Workspace: ${workspaceRoot}`);

    // Update UI to show generating status
    if (treeProvider) {
        treeProvider.setUnitTestStatus('generating');
    }
    SWLogger.section('Generate Unit Tests');
    SWLogger.log('Status: generating');

    const { progressService } = await import('./infrastructure/progressService');
    
    await progressService.withProgress('Generating Unit Test Plan with AI...', async (reporter) => {
        try {
            // Check for cancellation
            if (reporter.cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            reporter.report('Generating unit test plan...');
            
            // Check for cancellation before LLM call
            if (reporter.cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Generate unit test plan using LLM service
            const lastCodeAnalysis = stateManager.getCodeAnalysis();
            const unitTestPlan = await llmService.generateUnitTestPlan(
                lastAnalysisContext!,
                lastCodeAnalysis || undefined,
                lastEnhancedProductDocs || undefined,
                lastLLMInsights || undefined,
                workspaceRoot,
                reporter.cancellationToken
            );

            // Check for cancellation before saving
            if (reporter.cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            // Save unit test plan
            reporter.report('Saving unit test plan...');
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
            
            // Extract and write actual test files from the plan
            reporter.report('Writing test files...');
            const testFilesWritten = await writeTestFilesFromPlan(transformedPlan, workspaceRoot);
            SWLogger.log(`Written ${testFilesWritten.length} test file(s): ${testFilesWritten.join(', ')}`);
            
            // Refresh the unit tests navigator to show the new plan
            const unitTestsNavigator = stateManager.getUnitTestsNavigator();
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
            
            const message = testFilesWritten.length > 0
                ? `✅ Unit test plan generated and ${testFilesWritten.length} test file(s) written! Check the "Unit Tests" panel.`
                : '✅ Unit test plan generated! Check the "Unit Tests" panel to view it.';
            vscode.window.showInformationMessage(message);
            
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

                const insights = await llmService.generateArchitectureInsights(
                    lastAnalysisContext!,
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

            const report = await llmService.generateComprehensiveReport(
                lastAnalysisContext!,
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

