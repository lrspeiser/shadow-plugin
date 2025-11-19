/**
 * LLM Service for calling OpenAI/Claude to generate intelligent insights
 * Refactored to use extracted providers, parser, and infrastructure
 */
import * as vscode from 'vscode';
import { FileSummary, ModuleSummary, EnhancedProductDocumentation, detectFileRole, groupFilesByModule, detectModuleType, readFileContent } from './fileDocumentation';
import { CodeAnalysis, FileInfo, FunctionMetadata } from './analyzer';
import { EnhancedAnalyzer } from './analysis/enhancedAnalyzer';
import { productPurposeAnalysisSchema, llmInsightsSchema, productDocumentationSchema, unitTestPlanSchema } from './llmSchemas';
import { FileAccessHelper, LLMRequest } from './fileAccessHelper';
import { SWLogger } from './logger';
import { getConfigurationManager, LLMProvider as ConfigLLMProvider } from './config/configurationManager';
import { ProviderFactory, LLMProvider } from './ai/providers/providerFactory';
import { LLMResponseParser } from './ai/llmResponseParser';
import { RateLimiter } from './ai/llmRateLimiter';
import { RetryHandler } from './ai/llmRetryHandler';
import { PromptBuilder } from './domain/prompts/promptBuilder';
import { IncrementalAnalysisService } from './domain/services/incrementalAnalysisService';
import { RefactoringPromptBuilder, FunctionAnalysis } from './domain/prompts/refactoringPromptBuilder';
import { FunctionAnalyzer } from './analysis/functionAnalyzer';

export interface AnalysisContext {
    files: Array<{
        path: string;
        lines: number;
        functions: number;
        language: string;
    }>;
    imports: { [key: string]: string[] };
    entryPoints: Array<{
        path: string;
        type: string;
        reason: string;
    }>;
    orphanedFiles: string[];
    importedFiles: string[];
    totalFiles: number;
    totalLines: number;
    totalFunctions: number;
    largeFiles: number;
}

export interface ProductPurposeAnalysis {
    productPurpose: string; // What the product is trying to achieve
    architectureRationale: string; // Why the current architecture exists (e.g., why multiple entry points)
    designDecisions: string[]; // Key architectural decisions and their reasons
    userGoals: string[]; // What users are trying to accomplish with this product
    contextualFactors: string[]; // Factors that influence architecture (e.g., multi-interface, extensibility)
}

export interface LLMInsightItem {
    title: string; // Human-readable title
    description: string; // Detailed description
    relevantFiles?: string[]; // Relevant file paths
    relevantFunctions?: string[]; // Relevant function/class names
}

export interface LLMInsights {
    overallAssessment: string;
    strengths: string[];
    issues: (LLMInsightItem | string)[]; // Structured with title, description, files, functions (or legacy string format)
    organization: string;
    entryPointsAnalysis: string;
    orphanedFilesAnalysis: string;
    folderReorganization: string;
    recommendations: (LLMInsightItem | string)[]; // Structured with title, description, files, functions (or legacy string format)
    priorities: (LLMInsightItem | string)[]; // Structured with title, description, files, functions (or legacy string format)
    cursorPrompt?: string;
    productPurposeAnalysis?: ProductPurposeAnalysis; // New: understanding of WHY architecture exists
    rawContent?: string; // Fallback raw LLM response
}

export interface ProductDocumentation {
    overview: string;
    features: string[];
    architecture: string;
    techStack: string[];
    apiEndpoints?: string[];
    dataModels?: string[];
    userFlows?: string[];
    rawContent?: string; // Store raw LLM response for fallback display
}


export class LLMService {
    private providerFactory: ProviderFactory;
    private responseParser: LLMResponseParser;
    private rateLimiter: RateLimiter;
    private retryHandler: RetryHandler;
    private promptBuilder: PromptBuilder;
    private refactoringPromptBuilder: RefactoringPromptBuilder;
    private functionAnalyzer: FunctionAnalyzer;
    private incrementalAnalysisService: IncrementalAnalysisService | null = null;
    private onConfigurationChange: (() => void) | null = null;
    private configManager = getConfigurationManager();

    constructor() {
        this.providerFactory = new ProviderFactory();
        this.responseParser = new LLMResponseParser();
        this.rateLimiter = new RateLimiter();
        this.retryHandler = new RetryHandler();
        this.promptBuilder = new PromptBuilder();
        this.refactoringPromptBuilder = new RefactoringPromptBuilder();
        this.functionAnalyzer = new FunctionAnalyzer();
        
        // Listen for configuration changes via ConfigurationManager
        this.configManager.onConfigurationChange(() => {
            // Notify listeners that configuration changed
            if (this.onConfigurationChange) {
                this.onConfigurationChange();
            }
        });
    }

    public setOnConfigurationChange(callback: () => void): void {
        this.onConfigurationChange = callback;
    }

    public isConfigured(): boolean {
        const provider = this.configManager.llmProvider;
        return this.providerFactory.isProviderConfigured(provider);
    }

    public getProvider(): LLMProvider {
        return this.configManager.llmProvider;
    }

    public async promptForApiKey(provider?: LLMProvider): Promise<boolean> {
        const targetProvider = provider || this.getProvider();
        const isClaude = targetProvider === 'claude';
        
        const result = await vscode.window.showInputBox({
            prompt: `Enter your ${isClaude ? 'Claude' : 'OpenAI'} API Key (you can paste it here)`,
            password: true,
            placeHolder: isClaude ? 'sk-ant-api03-... (paste your key here)' : 'sk-... (paste your key here)',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'API key is required';
                }
                if (isClaude && !value.startsWith('sk-ant-')) {
                    return 'Claude API key should start with sk-ant-';
                }
                if (!isClaude && !value.startsWith('sk-')) {
                    return 'OpenAI API key should start with sk-';
                }
                return null;
            }
        });

        if (result) {
            const keyName = isClaude ? 'claudeApiKey' : 'openaiApiKey';
            await this.configManager.update(keyName, result.trim(), vscode.ConfigurationTarget.Global);
            
            // If setting the key for the current provider, also update the provider if needed
            if (!provider && targetProvider !== this.getProvider()) {
                await this.configManager.update('llmProvider', targetProvider, vscode.ConfigurationTarget.Global);
            }
            
            return true;
        }

        return false;
    }
    
    public async promptForClaudeApiKey(): Promise<boolean> {
        return this.promptForApiKey('claude');
    }
    
    public async promptForOpenAIApiKey(): Promise<boolean> {
        return this.promptForApiKey('openai');
    }

    /**
     * Generate enhanced product documentation following the blueprint:
     * 1. File-level summaries
     * 2. Module-level rollups
     * 3. Product-level docs
     * 4. Full aggregation
     */
    public async generateEnhancedProductDocs(
        analysis: CodeAnalysis,
        workspaceRoot: string,
        callbacks?: {
            onFileStart?: (filePath: string, index: number, total: number) => void;
            onFileSummary?: (summary: FileSummary, index: number, total: number) => void;
            onModuleSummary?: (summary: ModuleSummary, index: number, total: number) => void;
            onProductDocIteration?: (doc: EnhancedProductDocumentation, iteration: number, maxIterations: number) => void;
        }
    ): Promise<EnhancedProductDocumentation> {
        SWLogger.section('Product Docs: Start');
        SWLogger.log(`Files: ${analysis.files.length}, EntryPoints: ${analysis.entryPoints.length}`);
        
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }

        console.log('Starting enhanced product documentation generation...');
        console.log(`Analyzing ${analysis.files.length} files`);

        // STEP 1: File-level analysis (limit to prevent token overflow)
        const fileSummaries: FileSummary[] = [];
        const maxFilesToAnalyze = 50;
        const filesToAnalyze = analysis.files.slice(0, maxFilesToAnalyze);

        for (let i = 0; i < filesToAnalyze.length; i++) {
            const file = filesToAnalyze[i];
            try {
                console.log(`Analyzing file ${i + 1}/${filesToAnalyze.length}: ${file.path}`);
                SWLogger.log(`File analysis ${i + 1}/${filesToAnalyze.length}: ${file.path}`);
                
                // Call callback before sending to LLM
                if (callbacks?.onFileStart) {
                    callbacks.onFileStart(file.path, i + 1, filesToAnalyze.length);
                }
                
                const summary = await this.analyzeFile(file, workspaceRoot);
                fileSummaries.push(summary);
                
                // Call incremental save callback after receiving from LLM
                if (callbacks?.onFileSummary) {
                    callbacks.onFileSummary(summary, i + 1, filesToAnalyze.length);
                }
            } catch (error) {
                const errorDetails = {
                    file: file.path,
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    // Include more context for debugging
                };
                console.error(`Failed to analyze file ${file.path}:`, errorDetails);
                SWLogger.log(`ERROR analyzing file ${file.path}: ${JSON.stringify(errorDetails, null, 2)}`);
                
                // Create basic summary as fallback with error details
                const fallbackSummary = {
                    file: file.path,
                    role: detectFileRole(file.path, file),
                    purpose: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
                    userVisibleActions: [],
                    developerVisibleActions: [],
                    keyFunctions: [],
                    dependencies: [],
                    intent: `Could not analyze this file. Error: ${error instanceof Error ? error.message : String(error)}`,
                    rawContent: `Error during analysis: ${JSON.stringify(errorDetails, null, 2)}`
                };
                fileSummaries.push(fallbackSummary);
                
                // Call incremental save callback for fallback too
                if (callbacks?.onFileSummary) {
                    callbacks.onFileSummary(fallbackSummary, i + 1, filesToAnalyze.length);
                }
            }
        }

        // STEP 2: Module-level rollups
        SWLogger.section('Product Docs: Module Rollups');
        const moduleSummaries = await this.generateModuleRollups(fileSummaries, workspaceRoot, callbacks);

        // STEP 3: Product-level documentation
        SWLogger.section('Product Docs: Product-Level Doc');
        const productDoc = await this.generateProductLevelDoc(
            fileSummaries,
            moduleSummaries,
            analysis,
            workspaceRoot,
            callbacks
        );
        SWLogger.log('Product Docs: Completed');

        return productDoc;
    }

    /**
     * STEP 1: Analyze a single file
     */
    private async analyzeFile(file: FileInfo, workspaceRoot: string): Promise<FileSummary> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }

        const fileContent = await readFileContent(file.path, workspaceRoot);
        const role = detectFileRole(file.path, file);

        const prompt = this.promptBuilder.buildFileAnalysisPrompt(file, fileContent || '', role);

        // Wait for rate limit if needed
        await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
        
        // Send request with retry
        const response = await this.retryHandler.executeWithRetry(
            async () => {
                const llmResponse = await provider.sendRequest({
                    model: 'gpt-5.1',
                    systemPrompt: 'You are an expert code analyst who extracts user-facing and developer-facing behavior from code files. Focus on WHAT the code does from a user perspective, not implementation details.',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                });
                
                // Record request for rate limiting
                this.rateLimiter.recordRequest(provider.getName() as any);
                
                return llmResponse;
            }
        );

        return this.responseParser.parseFileSummary(response.content, file.path, role);
    }

    /**
     * STEP 2: Generate module-level rollups
     */
    private async generateModuleRollups(
        fileSummaries: FileSummary[],
        workspaceRoot: string,
        callbacks?: {
            onModuleSummary?: (summary: ModuleSummary, index: number, total: number) => void;
        }
    ): Promise<ModuleSummary[]> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }

        const modules = groupFilesByModule(
            fileSummaries.map(fs => ({
                path: fs.file,
                lines: 0,
                functions: 0,
                language: 'unknown'
            }))
        );

        const moduleSummaries: ModuleSummary[] = [];

        for (const [modulePath, files] of modules.entries()) {
            const moduleFiles = fileSummaries.filter(fs => 
                files.some(f => f.path === fs.file)
            );

            if (moduleFiles.length === 0) continue;

            const moduleType = detectModuleType(modulePath);
            SWLogger.log(`Module rollup: ${modulePath} (${moduleType}), files=${moduleFiles.length}`);
            const prompt = this.promptBuilder.buildModuleRollupPrompt(modulePath, moduleType, moduleFiles);

            try {
                // Wait for rate limit if needed
                await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
                
                // Send request with retry
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        const llmResponse = await provider.sendRequest({
                            model: 'gpt-5.1',
                            systemPrompt: 'You are an expert technical writer who creates module-level summaries from file-level documentation. Focus on user-facing capabilities and workflows.',
                            messages: [
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                        });
                        
                        // Record request for rate limiting
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        
                        return llmResponse;
                    }
                );

                const summary = this.responseParser.parseModuleSummary(response.content, modulePath, moduleType, moduleFiles);
                moduleSummaries.push(summary);
                
                // Call incremental save callback
                if (callbacks?.onModuleSummary) {
                    callbacks.onModuleSummary(summary, moduleSummaries.length, modules.size);
                }
            } catch (error) {
                const errorDetails = {
                    module: modulePath,
                    moduleType: moduleType,
                    fileCount: moduleFiles.length,
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                };
                console.error(`Failed to generate module summary for ${modulePath}:`, errorDetails);
                SWLogger.log(`ERROR module summary ${modulePath}: ${JSON.stringify(errorDetails, null, 2)}`);
                
                const fallbackSummary = {
                    module: modulePath,
                    moduleType: moduleType,
                    capabilities: [],
                    summary: `Module analysis failed: ${error instanceof Error ? error.message : String(error)}`,
                    files: moduleFiles
                };
                moduleSummaries.push(fallbackSummary);
                
                // Call incremental save callback for fallback too
                if (callbacks?.onModuleSummary) {
                    callbacks.onModuleSummary(fallbackSummary, moduleSummaries.length, modules.size);
                }
            }
        }

        return moduleSummaries;
    }

    /**
     * STEP 3: Generate product-level documentation
     */
    private async generateProductLevelDoc(
        fileSummaries: FileSummary[],
        moduleSummaries: ModuleSummary[],
        analysis: CodeAnalysis,
        workspaceRoot: string,
        callbacks?: {
            onProductDocIteration?: (doc: EnhancedProductDocumentation, iteration: number, maxIterations: number) => void;
        }
    ): Promise<EnhancedProductDocumentation> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }

        const isClaude = provider.getName() === 'claude';
        const fileAccessHelper = new FileAccessHelper(workspaceRoot);
        const incrementalService = new IncrementalAnalysisService(fileAccessHelper);
        const basePrompt = this.promptBuilder.buildProductLevelPrompt(fileSummaries, moduleSummaries, analysis, fileAccessHelper);
        const messages: any[] = [];
        const maxIterations = 3;
        let finalResult: any = null;

        for (let iteration = 1; iteration <= maxIterations; iteration++) {
            console.log(`[Product Documentation] Iteration ${iteration}/${maxIterations}`);
            SWLogger.log(`Product-level iteration ${iteration}/${maxIterations}`);

            // Add base prompt or continuation message
            if (iteration === 1) {
                messages.push({
                    role: 'user',
                    content: basePrompt
                });
            } else {
                messages.push({
                    role: 'user',
                    content: 'Please provide your final analysis based on the additional information provided above.'
                });
            }

            // Wait for rate limit if needed
            await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
            
            // Send request with retry
            const structuredResponse = await this.retryHandler.executeWithRetry(
                async () => {
                    if (isClaude) {
                        // Use Claude with structured outputs for guaranteed JSON
                        console.log('[Product Documentation] Using Claude with structured outputs...');
                        const response = await provider.sendStructuredRequest(
                            {
                                model: 'claude-sonnet-4-5',
                                systemPrompt: 'You are an expert product documentation writer who creates user-facing product documentation from code analysis. Your job is to describe what THIS SPECIFIC application does for users, not how it\'s built. NEVER mention file paths, folder structures, or technical implementation details. Focus on user functionality, workflows, and problems solved. Be specific to the application being analyzed, not generic.',
                                messages: messages,
                            },
                            productDocumentationSchema
                        );
                        SWLogger.log('Claude response received (product docs)');
                        return response;
                    } else {
                        // Use OpenAI with JSON mode
                        const response = await provider.sendStructuredRequest(
                            {
                                model: 'gpt-5.1',
                                systemPrompt: 'You are an expert product documentation writer who creates user-facing product documentation from code analysis. Your job is to describe what THIS SPECIFIC application does for users, not how it\'s built. NEVER mention file paths, folder structures, or technical implementation details. Focus on user functionality, workflows, and problems solved. Be specific to the application being analyzed, not generic. You MUST respond with valid JSON only, no markdown, no code blocks.',
                                messages: messages,
                            },
                            productDocumentationSchema
                        );
                        SWLogger.log('OpenAI response received (product docs)');
                        return response;
                    }
                }
            );
            
            // Record request for rate limiting
            this.rateLimiter.recordRequest(provider.getName() as any);
            
            finalResult = structuredResponse.data;

            // Call incremental save callback for this iteration
            if (callbacks?.onProductDocIteration) {
                callbacks.onProductDocIteration(finalResult as EnhancedProductDocumentation, iteration, maxIterations);
            }
            
            // Check if LLM requested more information
            const requests: LLMRequest[] = finalResult.requests || [];
            
            if (requests.length === 0 || iteration >= maxIterations) {
                // No more requests or max iterations reached
                console.log(`[Product Documentation] Completed after ${iteration} iteration(s)`);
                SWLogger.log(`Product docs complete after ${iteration} iteration(s)`);
                break;
            }

            // Process requests using incremental service
            console.log(`[Product Documentation] Processing ${requests.length} request(s) in iteration ${iteration}`);
            SWLogger.log(`Processing ${requests.length} request(s)`);
            const { messages: updatedMessages } = incrementalService.processRequests(requests, finalResult, messages);
            messages.length = 0;
            messages.push(...updatedMessages);
        }

        // Remove requests field before returning
        if (finalResult && finalResult.requests) {
            delete finalResult.requests;
        }

        console.log('✅ [Product Documentation] Generation complete');
        
        // Merge with fileSummaries and moduleSummaries
        return {
            ...finalResult,
            modules: moduleSummaries,
            fileSummaries: fileSummaries,
            rawContent: JSON.stringify(finalResult)
        } as EnhancedProductDocumentation;
    }

    /**
     * Generate product documentation from codebase analysis (legacy method - kept for compatibility)
     */
    public async generateProductDocs(context: AnalysisContext): Promise<ProductDocumentation> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }

        const prompt = this.promptBuilder.buildProductDocsPrompt(context);

        // Wait for rate limit if needed
        await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
        
        // Send request with retry
        const response = await this.retryHandler.executeWithRetry(
            async () => {
                const llmResponse = await provider.sendRequest({
                    model: 'gpt-5.1',
                    systemPrompt: 'You are an expert technical writer who creates clear, comprehensive product documentation from code analysis.',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                });
                
                // Record request for rate limiting
                this.rateLimiter.recordRequest(provider.getName() as any);
                
                return llmResponse;
            }
        );

        console.log('Product Docs LLM Response (first 1000 chars):', response.content.substring(0, 1000));
        const parsed = this.responseParser.parseProductDocs(response.content);
        console.log('Parsed Product Docs:', {
            hasOverview: !!parsed.overview,
            featuresCount: parsed.features.length,
            hasArchitecture: !!parsed.architecture,
            techStackCount: parsed.techStack.length
        });
        return parsed;
    }

    /**
     * Analyze product purpose and architecture rationale
     * Separate LLM call to understand WHY the architecture exists
     */
    public async analyzeProductPurpose(
        productDocs: EnhancedProductDocumentation,
        context: AnalysisContext
    ): Promise<ProductPurposeAnalysis> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }
        
        const isClaude = provider.getName() === 'claude';

        const prompt = this.promptBuilder.buildProductPurposePrompt(productDocs, context);
        const providerName = isClaude ? 'Claude' : 'OpenAI';
        console.log(`[Product Purpose] Using ${providerName} provider`);
        console.log('Product Purpose Analysis prompt length:', prompt.length);

        try {
            // Wait for rate limit if needed
            await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
            
            if (isClaude) {
                // Use Claude with structured outputs - NO PARSING NEEDED!
                console.log('[Product Purpose] Using Claude with structured outputs...');
                const structuredResponse = await this.retryHandler.executeWithRetry(
                    async () => {
                        const response = await provider.sendStructuredRequest(
                            {
                                model: 'claude-sonnet-4-5',
                                systemPrompt: 'You are an expert software architect who understands how product goals and user needs shape architecture decisions.',
                                messages: [
                                    {
                                        role: 'user',
                                        content: prompt
                                    }
                                ],
                            },
                            productPurposeAnalysisSchema
                        );
                        
                        // Record request for rate limiting
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        
                        return response;
                    }
                );

                console.log('✅ [Product Purpose] Claude structured output received (no parsing needed)');
                return structuredResponse.data as ProductPurposeAnalysis;
            } else {
                // Use OpenAI with fallback models
                const openaiProvider = this.providerFactory.getProvider('openai');
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        const llmResponse = await (openaiProvider as any).sendRequestWithFallback(
                            {
                                model: 'gpt-5.1',
                                systemPrompt: 'You are an expert software architect who understands how product goals and user needs shape architecture decisions.',
                                messages: [
                                    {
                                        role: 'user',
                                        content: prompt
                                    }
                                ],
                            },
                            ['gpt-5.1', 'gpt-5', 'gpt-4o', 'gpt-4-turbo']
                        );
                        
                        // Record request for rate limiting
                        this.rateLimiter.recordRequest('openai');
                        
                        return llmResponse;
                    }
                );

                return this.responseParser.parseProductPurposeAnalysis(response.content);
            }
        } catch (error: any) {
            console.error('Error in analyzeProductPurpose:', error);
            // Return a default analysis if it fails
            return {
                productPurpose: productDocs.overview || 'Unable to analyze product purpose',
                architectureRationale: 'Unable to determine architecture rationale',
                designDecisions: [],
                userGoals: productDocs.whatItDoes || [],
                contextualFactors: []
            };
        }
    }

    /**
     * Generate architecture insights using LLM
     * Now uses both code analysis and product documentation for richer insights
     * Uses multi-step approach: first analyzes product purpose, then generates contextual recommendations
     */
    public async generateArchitectureInsights(
        context: AnalysisContext,
        codeAnalysis?: CodeAnalysis,
        productDocs?: EnhancedProductDocumentation,
        callbacks?: {
            onProductPurposeStart?: () => void;
            onProductPurposeAnalysis?: (productPurpose: ProductPurposeAnalysis) => void;
            onInsightsIterationStart?: (iteration: number, maxIterations: number) => void;
            onInsightsIteration?: (insights: LLMInsights, iteration: number, maxIterations: number) => void;
        }
    ): Promise<LLMInsights> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }
        
        const isClaude = provider.getName() === 'claude';

        // Step 1: Analyze product purpose and architecture rationale (if product docs available)
        let productPurposeAnalysis: ProductPurposeAnalysis | undefined;
        if (productDocs) {
            console.log('Step 1: Analyzing product purpose and architecture rationale...');
            
            // Call callback before sending to LLM
            if (callbacks?.onProductPurposeStart) {
                callbacks.onProductPurposeStart();
            }
            
            productPurposeAnalysis = await this.analyzeProductPurpose(productDocs, context);
            console.log('Product Purpose Analysis:', productPurposeAnalysis);
            
            // Call incremental save callback after receiving from LLM
            if (callbacks?.onProductPurposeAnalysis) {
                callbacks.onProductPurposeAnalysis(productPurposeAnalysis);
            }
        }

        // Step 2: Generate architecture insights with product purpose context (iterative loop)
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const fileAccessHelper = new FileAccessHelper(workspaceRoot);
        const incrementalService = new IncrementalAnalysisService(fileAccessHelper);
        const basePrompt = this.promptBuilder.buildArchitecturePrompt(context, codeAnalysis, productDocs, productPurposeAnalysis, fileAccessHelper);
        const providerName = isClaude ? 'Claude' : 'OpenAI';
        console.log(`[Architecture Insights] Using ${providerName} provider`);
        console.log('Architecture prompt length:', basePrompt.length);

        try {
            let insights: LLMInsights | null = null;
            const messages: any[] = [];
            const maxIterations = 3;
            let finalResult: any = null;
            
            for (let iteration = 1; iteration <= maxIterations; iteration++) {
                console.log(`[Architecture Insights] Iteration ${iteration}/${maxIterations}`);

                // Call callback before sending to LLM
                if (callbacks?.onInsightsIterationStart) {
                    callbacks.onInsightsIterationStart(iteration, maxIterations);
                }

                // Add base prompt or continuation message
                if (iteration === 1) {
                    messages.push({
                        role: 'user',
                        content: basePrompt
                    });
                } else {
                    messages.push({
                        role: 'user',
                        content: 'Please provide your final analysis based on the additional information provided above.'
                    });
                }

                // Wait for rate limit if needed
                await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
                
                if (isClaude) {
                    // Use Claude with structured outputs - NO PARSING NEEDED!
                    console.log('[Architecture Insights] Using Claude with structured outputs...');
                    const structuredResponse = await this.retryHandler.executeWithRetry(
                        async () => {
                            const response = await provider.sendStructuredRequest(
                                {
                                    model: 'claude-sonnet-4-5',
                                    systemPrompt: 'You are an expert software architect who provides clear, actionable insights about code architecture.',
                                    messages: messages,
                                },
                                llmInsightsSchema
                            );
                            
                            // Record request for rate limiting
                            this.rateLimiter.recordRequest(provider.getName() as any);
                            
                            return response;
                        }
                    );

                    finalResult = structuredResponse.data;
                    insights = finalResult as LLMInsights;
                    
                    console.log('✅ Claude structured output received (no parsing needed):', {
                        hasOverall: !!insights.overallAssessment,
                        strengthsCount: insights.strengths.length,
                        issuesCount: insights.issues.length
                    });
                } else {
                    // Use OpenAI with fallback models
                    const openaiProvider = this.providerFactory.getProvider('openai');
                    const response = await this.retryHandler.executeWithRetry(
                        async () => {
                            const llmResponse = await (openaiProvider as any).sendRequestWithFallback(
                                {
                                    model: 'gpt-5.1',
                                    systemPrompt: 'You are an expert software architect who provides clear, actionable insights about code architecture.',
                                    messages: messages,
                                },
                                ['gpt-5.1', 'gpt-5', 'gpt-4o', 'gpt-4-turbo']
                            );
                            
                            // Record request for rate limiting
                            this.rateLimiter.recordRequest('openai');
                            
                            return llmResponse;
                        }
                    );

                    if (response.finishReason === 'length') {
                        console.warn('⚠️ Response was truncated due to token limit.');
                    }
                    
                    if (!response.content || response.content.length === 0) {
                        throw new Error(`LLM API returned empty response. Finish reason: ${response.finishReason}`);
                    }

                    // Parse OpenAI response (traditional approach)
                    insights = this.responseParser.parseArchitectureInsights(response.content, context);
                    finalResult = insights;
                    
                    // Validate that issues have proposed fixes (only for OpenAI, Claude guarantees structure)
                    if (insights.issues && insights.issues.length > 0) {
                        const issuesWithoutFixes = insights.issues.filter(issue => {
                            const issueText = typeof issue === 'string' ? issue : issue.description;
                            if (!issueText.includes('**Proposed Fix**:')) {
                                return true;
                            }
                            const fixMatch = issueText.match(/\*\*Proposed Fix\*\*:\s*(.+)/s);
                            return !fixMatch || !fixMatch[1] || fixMatch[1].trim().length < 10;
                        });
                        
                        if (issuesWithoutFixes.length > 0) {
                            console.warn(`⚠️ Found ${issuesWithoutFixes.length} issue(s) with missing or very short Proposed Fix`);
                        }
                    }
                    
                    // Store raw content as fallback for OpenAI
                    insights.rawContent = response.content;
                }
                
                // Call incremental save callback for this iteration
                if (callbacks?.onInsightsIteration) {
                    callbacks.onInsightsIteration(insights, iteration, maxIterations);
                }

                // Check if LLM requested more information (only works with Claude structured outputs)
                const requests: LLMRequest[] = isClaude && finalResult ? (finalResult.requests || []) : [];
                
                if (requests.length === 0 || iteration >= maxIterations) {
                    // No more requests or max iterations reached
                    console.log(`[Architecture Insights] Completed after ${iteration} iteration(s)`);
                    break;
                }

                // Process requests using incremental service
                console.log(`[Architecture Insights] Processing ${requests.length} request(s) in iteration ${iteration}`);
                const { messages: updatedMessages } = incrementalService.processRequests(requests, finalResult, messages);
                messages.length = 0;
                messages.push(...updatedMessages);
            }

            // Remove requests field before returning
            if (finalResult && finalResult.requests) {
                delete finalResult.requests;
            }
            
            // Ensure insights is set
            if (!insights && finalResult) {
                insights = finalResult as LLMInsights;
            }
            
            if (!insights) {
                throw new Error('Failed to generate architecture insights after all iterations');
            }
            
            // Include product purpose analysis
            if (productPurposeAnalysis) {
                insights.productPurposeAnalysis = productPurposeAnalysis;
            }
            
            console.log('Architecture Insights:', {
                provider: isClaude ? 'Claude (structured)' : 'OpenAI (parsed)',
                hasOverall: !!insights.overallAssessment,
                strengthsCount: insights.strengths.length,
                issuesCount: insights.issues.length,
                hasOrganization: !!insights.organization,
                hasReorganization: !!insights.folderReorganization,
                recommendationsCount: insights.recommendations.length,
                prioritiesCount: insights.priorities.length
            });
            
            return insights;
        } catch (error: any) {
            console.error('Error in generateArchitectureInsights:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                statusText: error.statusText,
                response: error.response,
                stack: error.stack
            });
            throw error;
        }
    }

    private parseProductPurposeAnalysis(content: string): ProductPurposeAnalysis {
        return {
            productPurpose: this.extractSection(content, 'Product Purpose') || '',
            architectureRationale: this.extractSection(content, 'Architecture Rationale') || '',
            designDecisions: this.extractListSection(content, 'Key Design Decisions') || [],
            userGoals: this.extractListSection(content, 'User Goals') || [],
            contextualFactors: this.extractListSection(content, 'Contextual Factors') || []
        };
    }

    private parseProductDocs(content: string): ProductDocumentation {
        // Simple parsing - extract sections
        const sections: any = {
            overview: '',
            features: [],
            architecture: '',
            techStack: [],
            apiEndpoints: [],
            dataModels: [],
            userFlows: [],
            rawContent: content // Store raw content as fallback
        };

        // Extract overview - try multiple patterns
        const overviewPatterns = [
            /(?:Product Overview|Overview|## Overview|# Overview)[:\n\s]+(.*?)(?=\n##|\n#|$)/is,
            /(?:^|\n)(.*?)(?=\n##|$)/s, // First paragraph if no section header
            /^(.+?)(?=\n\n|$)/s // Very first line/paragraph
        ];
        
        for (const pattern of overviewPatterns) {
            const match = content.match(pattern);
            if (match && match[1] && match[1].trim().length > 20) {
                sections.overview = match[1].trim();
                break;
            }
        }

        // Extract features (bullet points under Features section)
        const featuresPatterns = [
            /(?:Key Features|Features|## Features|# Features)[:\n\s]+((?:[-•*]\s+.+?\n)+)/is,
            /(?:Key Features|Features)[:\n\s]+(.*?)(?=\n##|\n#|$)/is
        ];
        
        for (const pattern of featuresPatterns) {
            const featuresMatch = content.match(pattern);
            if (featuresMatch) {
                const featuresText = featuresMatch[1];
                sections.features = featuresText
                    .split('\n')
                    .filter(l => l.trim().match(/^[-•*\d]/))
                    .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
                    .filter(l => l.length > 0);
                if (sections.features.length > 0) break;
            }
        }

        sections.architecture = this.extractSection(content, 'Architecture') || 
                               this.extractSection(content, 'Architecture Overview') || '';
        sections.techStack = this.extractListSection(content, 'Tech Stack') || 
                            this.extractListSection(content, 'Technology Stack') || [];
        sections.apiEndpoints = this.extractListSection(content, 'API Endpoints') || [];
        sections.dataModels = this.extractListSection(content, 'Data Models') || [];
        sections.userFlows = this.extractListSection(content, 'User Flows') || [];

        return sections;
    }

    private parseArchitectureInsights(content: string, context: AnalysisContext): LLMInsights {
        console.log('Parsing LLM response, length:', content.length);
        console.log('First 1000 chars:', content.substring(0, 1000));
        
        // Try multiple variations of section names
        const insights: LLMInsights = {
            overallAssessment: this.extractSection(content, 'Overall Architecture Assessment') || 
                              this.extractSection(content, 'Architecture Assessment') ||
                              this.extractSection(content, 'Overall Assessment') ||
                              this.extractSection(content, 'Overall') || '',
            strengths: this.extractListSection(content, 'Strengths') || [],
            issues: this.extractListSection(content, 'Issues & Concerns') ||
                   this.extractListSection(content, 'Issues') || 
                   this.extractListSection(content, 'Concerns') || [],
            organization: this.extractSection(content, 'Code Organization') || 
                         this.extractSection(content, 'Organization') ||
                         this.extractSection(content, 'File Organization') || '',
            entryPointsAnalysis: this.extractSection(content, 'Entry Points') || 
                               this.extractSection(content, 'Entry Points Analysis') || '',
            orphanedFilesAnalysis: this.extractSection(content, 'Orphaned Files') || 
                                  this.extractSection(content, 'Orphaned Files Analysis') || '',
            folderReorganization: this.extractSection(content, 'Folder Reorganization') || 
                                 this.extractSection(content, 'Reorganization') ||
                                 this.extractSection(content, 'Folder Reorganization Plan') || '',
            recommendations: this.parseStructuredItems(content, 'Recommendations') || [],
            priorities: this.parseStructuredItems(content, 'Refactoring Priorities', 'Priorities', 'Refactoring') || []
        };

        console.log('Parsed insights:', {
            hasOverall: !!insights.overallAssessment,
            strengthsCount: insights.strengths.length,
            issuesCount: insights.issues.length,
            hasOrganization: !!insights.organization,
            hasReorganization: !!insights.folderReorganization,
            recommendationsCount: insights.recommendations.length,
            prioritiesCount: insights.priorities.length
        });

        // If parsing failed completely, try a more aggressive approach
        const hasAnyContent = insights.overallAssessment || 
                             insights.strengths.length > 0 ||
                             insights.issues.length > 0 ||
                             insights.organization ||
                             insights.folderReorganization ||
                             insights.recommendations.length > 0 ||
                             insights.priorities.length > 0;
        
        if (!hasAnyContent && content.length > 100) {
            console.warn('⚠️ Parsing failed - no content extracted. Raw content available as fallback.');
            // Try to extract at least the first paragraph as overall assessment
            const firstParagraph = content.split('\n\n').find(p => p.trim().length > 50);
            if (firstParagraph) {
                insights.overallAssessment = firstParagraph.trim();
                console.log('Extracted first paragraph as overall assessment');
            }
        }

        // Generate LLM refactoring prompt if reorganization is suggested
        if (insights.folderReorganization) {
            insights.cursorPrompt = this.generateCursorPrompt(context, insights);
        }

        return insights;
    }

    private extractSection(content: string, sectionName: string): string {
        // Escape special regex characters in section name
        const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Try multiple patterns - be more flexible with whitespace and newlines
        const patterns = [
            // Markdown headers with ## (most common)
            new RegExp(`##\\s+${escapedName}\\s*\\n+([\\s\\S]*?)(?=\\n##|$)`, 'i'),
            // Markdown headers with #
            new RegExp(`#\\s+${escapedName}\\s*\\n+([\\s\\S]*?)(?=\\n#|$)`, 'i'),
            // Markdown headers with ###
            new RegExp(`###\\s+${escapedName}\\s*\\n+([\\s\\S]*?)(?=\\n###|\\n##|\\n#|$)`, 'i'),
            // Markdown headers with colon
            new RegExp(`##\\s+${escapedName}\\s*[:]\\s*\\n+([\\s\\S]*?)(?=\\n##|$)`, 'i'),
            // Bold text
            new RegExp(`\\*\\*${escapedName}\\*\\*\\s*[:]?\\s*\\n+([\\s\\S]*?)(?=\\n\\*\\*|\\n##|\\n#|$)`, 'i'),
            // Numbered sections
            new RegExp(`\\d+\\.\\s*${escapedName}\\s*[:]?\\s*\\n+([\\s\\S]*?)(?=\\n\\d+\\.|\\n##|\\n#|$)`, 'i')
        ];
        
        for (const regex of patterns) {
            const match = content.match(regex);
            if (match && match[1]) {
                const extracted = match[1].trim();
                // Remove any trailing markdown headers that might have been captured
                const cleaned = extracted.replace(/\n##\s+.*$/s, '').trim();
                if (cleaned.length > 10) { // Only return if substantial content
                    return cleaned;
                }
            }
        }
        
        return '';
    }

    private extractListSection(content: string, sectionName: string): string[] {
        const section = this.extractSection(content, sectionName);
        if (!section) {
            console.log(`No section found for: ${sectionName}`);
            return [];
        }
        
        console.log(`Extracting list from section "${sectionName}", content length: ${section.length}`);
        console.log(`First 500 chars: ${section.substring(0, 500)}`);
        
        // Special handling for "Issues & Concerns" to ensure we capture Proposed Fix content
        const isIssuesSection = sectionName.includes('Issues') || sectionName.includes('Concerns');
        
        // Extract list items - handle multi-line items
        const items: string[] = [];
        
        // Split by lines and look for list markers
        const lines = section.split('\n');
        let currentItem: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Check if this line starts a new list item
            const isListItemStart = trimmed.match(/^[-•*]\s+/) || 
                                    trimmed.match(/^\d+[.)]\s+/) || 
                                    trimmed.match(/^[-•*]\s/) ||
                                    trimmed.match(/^[•]\s/);
            
            if (isListItemStart) {
                // Save previous item if it exists
                if (currentItem.length > 0) {
                    let fullItem = currentItem.join('\n').trim();
                    // Remove leading bullet/number marker
                    fullItem = fullItem.replace(/^[-•*\d.)]\s+/, '').trim();
                    
                    // For issues section, validate that Proposed Fix has content
                    if (isIssuesSection && fullItem.includes('**Proposed Fix**:')) {
                        const fixMatch = fullItem.match(/\*\*Proposed Fix\*\*:\s*(.+)/s);
                        if (!fixMatch || !fixMatch[1] || fixMatch[1].trim().length < 10) {
                            console.warn(`Issue found with empty or very short Proposed Fix: ${fullItem.substring(0, 200)}`);
                            // Try to continue reading to see if fix is on next lines
                            if (i < lines.length - 1) {
                                // Check if next lines might contain the fix
                                let fixContent = '';
                                for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                                    const nextLine = lines[j]?.trim();
                                    if (nextLine && !nextLine.match(/^[-•*\d.)]/)) {
                                        fixContent += nextLine + ' ';
                                    } else if (nextLine && nextLine.match(/^[-•*\d.)]/)) {
                                        break;
                                    }
                                }
                                if (fixContent.trim().length > 10) {
                                    fullItem += ' ' + fixContent.trim();
                                }
                            }
                        }
                    }
                    
                    if (fullItem.length > 0) {
                        items.push(fullItem);
                    }
                }
                // Start new item
                currentItem = [trimmed];
            } else if (currentItem.length > 0) {
                // Continue current item (multi-line)
                // For issues, also check if this line starts with "**Proposed Fix**:" on its own
                if (isIssuesSection && trimmed.match(/^\*\*Proposed Fix\*\*:/)) {
                    currentItem.push(trimmed);
                } else if (trimmed.length > 0) {
                    currentItem.push(trimmed);
                } else if (i < lines.length - 1) {
                    const nextLine = lines[i + 1]?.trim();
                    // If next line starts a new list item, don't add empty line
                    // Otherwise, it's part of the current item
                    if (nextLine && !nextLine.match(/^[-•*\d.)]/)) {
                        currentItem.push(trimmed);
                    }
                }
            }
        }
        
        // Don't forget the last item
        if (currentItem.length > 0) {
            let fullItem = currentItem.join('\n').trim();
            const cleaned = fullItem.replace(/^[-•*\d.)]\s+/, '').trim();
            
            // For issues section, validate Proposed Fix
            if (isIssuesSection && cleaned.includes('**Proposed Fix**:')) {
                const fixMatch = cleaned.match(/\*\*Proposed Fix\*\*:\s*(.+)/s);
                if (!fixMatch || !fixMatch[1] || fixMatch[1].trim().length < 10) {
                    console.warn(`Last issue has empty or very short Proposed Fix: ${cleaned.substring(0, 200)}`);
                }
            }
            
            if (cleaned.length > 0) {
                items.push(cleaned);
            }
        }
        
        // If no items found with markers, try to split by double newlines or look for paragraphs
        if (items.length === 0 && section.length > 0) {
            console.log(`No list markers found, trying paragraph split for: ${sectionName}`);
            // Try splitting by double newlines
            const paragraphs = section.split(/\n\s*\n/);
            for (const para of paragraphs) {
                const trimmed = para.trim();
                // Remove any leading dashes/bullets that might not have been caught
                const cleaned = trimmed.replace(/^[-•*\d.)]\s+/, '').trim();
                if (cleaned.length > 20) { // Only substantial paragraphs
                    items.push(cleaned);
                }
            }
        }
        
        console.log(`Extracted ${items.length} items from "${sectionName}"`);
        if (items.length > 0) {
            console.log(`First item (full): ${items[0]}`);
            console.log(`First item (preview): ${items[0].substring(0, 300)}`);
            
            // Check for issues with empty fixes
            if (isIssuesSection) {
                items.forEach((item, idx) => {
                    if (item.includes('**Proposed Fix**:') && !item.match(/\*\*Proposed Fix\*\*:\s+.+/s)) {
                        console.warn(`Issue ${idx + 1} appears to have empty Proposed Fix`);
                    }
                });
            }
        }
        
        return items;
    }

    /**
     * Parse structured items (issues, recommendations, priorities) from OpenAI responses
     * Falls back to simple string array if structured format not found
     */
    private parseStructuredItems(content: string, ...sectionNames: string[]): LLMInsightItem[] | string[] {
        const section = sectionNames
            .map(name => this.extractSection(content, name))
            .find(s => s && s.length > 0);
        
        if (!section) {
            // Fallback to simple list extraction
            return this.extractListSection(content, sectionNames[0]) || [];
        }

        // Try to parse structured format
        const items: LLMInsightItem[] = [];
        const lines = section.split('\n');
        let currentItem: Partial<LLMInsightItem> | null = null;

        for (const line of lines) {
            const trimmed = line.trim();
            
            // Check for title pattern
            if (trimmed.match(/^[-•*]\s*Title:\s*(.+)/i) || trimmed.match(/^Title:\s*(.+)/i)) {
                if (currentItem && currentItem.title && currentItem.description) {
                    items.push({
                        title: currentItem.title,
                        description: currentItem.description,
                        relevantFiles: currentItem.relevantFiles || [],
                        relevantFunctions: currentItem.relevantFunctions || []
                    });
                }
                const titleMatch = trimmed.match(/Title:\s*(.+)/i);
                currentItem = {
                    title: titleMatch ? titleMatch[1].trim() : '',
                    description: '',
                    relevantFiles: [],
                    relevantFunctions: []
                };
            } else if (trimmed.match(/^Description:\s*(.+)/i)) {
                const descMatch = trimmed.match(/Description:\s*(.+)/i);
                if (currentItem && descMatch) {
                    currentItem.description = descMatch[1].trim();
                }
            } else if (trimmed.match(/^Relevant Files?:/i)) {
                // Skip header, will collect on next lines
            } else if (trimmed.match(/^Relevant Functions?:/i)) {
                // Skip header, will collect on next lines
            } else if (currentItem && trimmed.match(/^[-•*]\s*["'](.+)["']/)) {
                // Could be a file or function - try to detect
                const match = trimmed.match(/^[-•*]\s*["'](.+)["']/);
                if (match) {
                    const value = match[1];
                    if (value.includes('/') || value.includes('\\') || value.endsWith('.ts') || value.endsWith('.js') || value.endsWith('.py')) {
                        currentItem.relevantFiles = currentItem.relevantFiles || [];
                        currentItem.relevantFiles.push(value);
                    } else {
                        currentItem.relevantFunctions = currentItem.relevantFunctions || [];
                        currentItem.relevantFunctions.push(value);
                    }
                }
            } else if (currentItem && trimmed.length > 0 && !trimmed.match(/^[-•*\d.)]/)) {
                // Continuation of description
                if (currentItem.description) {
                    currentItem.description += ' ' + trimmed;
                } else {
                    currentItem.description = trimmed;
                }
            }
        }

        // Don't forget the last item
        if (currentItem && currentItem.title && currentItem.description) {
            items.push({
                title: currentItem.title,
                description: currentItem.description,
                relevantFiles: currentItem.relevantFiles || [],
                relevantFunctions: currentItem.relevantFunctions || []
            });
        }

        // If we couldn't parse structured format, fall back to simple strings
        if (items.length === 0) {
            const simpleItems = this.extractListSection(content, sectionNames[0]) || [];
            return simpleItems;
        }

        return items;
    }

    private generateCursorPrompt(context: AnalysisContext, insights: LLMInsights): string {
        let prompt = `# Code Reorganization Task

I need you to refactor this codebase's folder structure based on architectural analysis.

## Current State

**Total Files**: ${context.totalFiles}
**Entry Points**: ${context.entryPoints.length}

### Current File List
`;
        
        for (const file of context.files.sort((a, b) => a.path.localeCompare(b.path))) {
            prompt += `- \`${file.path}\` (${file.lines} LOC)\n`;
        }

        prompt += '\n### Import Dependencies\n\n';
        const imports = Object.entries(context.imports).slice(0, 10);
        for (const [file, deps] of imports) {
            prompt += `\`${file}\` imports:\n`;
            for (const dep of deps.slice(0, 5)) {
                prompt += `  - \`${dep}\`\n`;
            }
            if (deps.length > 5) {
                prompt += `  - ... and ${deps.length - 5} more\n`;
            }
            prompt += '\n';
        }

        prompt += `
## Architectural Insights

### Recommended Folder Reorganization

${insights.folderReorganization}

### Reasoning

${insights.organization}

## Your Task

Please reorganize the codebase following these steps:

1. **Create New Folder Structure**: Create the recommended folders
2. **Move Files**: Move each file, updating import paths
3. **Update Imports**: Fix all import statements
4. **Verify Entry Points**: Ensure entry points work
5. **Test**: Verify the code runs

## Guidelines

- Preserve all code logic
- Update all imports automatically
- Create __init__.py files for Python packages
- Use git mv to preserve git history
- Update configuration files

## Verification

1. Check all imports resolve
2. Run linters
3. Verify entry points execute
4. Run tests if available

Please proceed with reorganization, moving one file at a time.
`;

        return prompt;
    }


    // ========== Enhanced Documentation Parsers ==========

    private parseFileSummary(content: string, filePath: string, role: string): FileSummary {
        try {
            // Try to parse as JSON first
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    file: filePath,
                    role: role,
                    purpose: parsed.purpose || '',
                    userVisibleActions: parsed.userVisibleActions || [],
                    developerVisibleActions: parsed.developerVisibleActions || [],
                    keyFunctions: parsed.keyFunctions || [],
                    dependencies: parsed.dependencies || [],
                    intent: parsed.intent || '',
                    rawContent: content
                };
            }
        } catch (error) {
            console.error('Failed to parse file summary as JSON:', error);
        }

        // Fallback: extract from text
        return {
            file: filePath,
            role: role,
            purpose: this.extractSection(content, 'purpose') || 'Could not extract purpose',
            userVisibleActions: this.extractListSection(content, 'userVisibleActions') || [],
            developerVisibleActions: this.extractListSection(content, 'developerVisibleActions') || [],
            keyFunctions: [],
            dependencies: this.extractListSection(content, 'dependencies') || [],
            intent: this.extractSection(content, 'intent') || '',
            rawContent: content
        };
    }

    private parseModuleSummary(
        content: string,
        modulePath: string,
        moduleType: string,
        files: FileSummary[]
    ): ModuleSummary {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    module: modulePath,
                    moduleType: moduleType,
                    capabilities: parsed.capabilities || [],
                    summary: parsed.summary || '',
                    files: files,
                    endpoints: parsed.endpoints,
                    commands: parsed.commands,
                    workers: parsed.workers
                };
            }
        } catch (error) {
            console.error('Failed to parse module summary as JSON:', error);
        }

        return {
            module: modulePath,
            moduleType: moduleType,
            capabilities: this.extractListSection(content, 'capabilities') || [],
            summary: this.extractSection(content, 'summary') || '',
            files: files
        };
    }

    private parseProductLevelDoc(
        content: string,
        fileSummaries: FileSummary[],
        moduleSummaries: ModuleSummary[]
    ): EnhancedProductDocumentation {
        return {
            overview: this.extractSection(content, 'Product Overview') || '',
            whatItDoes: this.extractListSection(content, 'What It Does') || [],
            userPerspective: {
                gui: this.extractListSection(content, 'GUI') || [],
                cli: this.extractListSection(content, 'CLI') || [],
                api: this.extractListSection(content, 'API') || [],
                cicd: this.extractListSection(content, 'CI/CD') || []
            },
            workflowIntegration: this.extractListSection(content, 'Workflow Integration') || [],
            problemsSolved: this.extractListSection(content, 'Problems Solved') || [],
            architecture: this.extractSection(content, 'Architecture Summary') || '',
            modules: moduleSummaries,
            fileSummaries: fileSummaries,
            rawContent: content
        };
    }

    /**
     * Generate unit test plan using LLM directly (no backend required)
     */
    public async generateUnitTestPlan(
        context: AnalysisContext,
        codeAnalysis?: CodeAnalysis,
        productDocs?: EnhancedProductDocumentation,
        architectureInsights?: LLMInsights,
        workspaceRoot?: string,
        cancellationToken?: vscode.CancellationToken
    ): Promise<any> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }
        
        const isClaude = provider.getName() === 'claude';

        SWLogger.section('Unit Test Plan Generation');
        SWLogger.log('Building prompt...');

        const prompt = this.buildUnitTestPlanPrompt(context, codeAnalysis, productDocs, architectureInsights);
        
        const providerName = isClaude ? 'Claude' : 'OpenAI';
        console.log(`[Unit Test Plan] Using ${providerName} provider`);
        console.log('Unit test prompt length:', prompt.length);

        try {
            // Check for cancellation before LLM call
            if (cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            let result: any = null;

            // Wait for rate limit if needed
            await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
            
            if (isClaude) {
                // Use Claude with structured outputs - NO PARSING NEEDED!
                console.log('[Unit Test Plan] Using Claude with structured outputs...');
                const structuredResponse = await this.retryHandler.executeWithRetry(
                    async () => {
                        const response = await provider.sendStructuredRequest(
                            {
                                model: 'claude-sonnet-4-5',
                                systemPrompt: 'You are an expert test architect who creates comprehensive unit test plans.',
                                messages: [{
                                    role: 'user',
                                    content: prompt
                                }],
                            },
                            unitTestPlanSchema
                        );
                        
                        // Record request for rate limiting
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        
                        return response;
                    }
                );

                result = structuredResponse.data;
                
                console.log('✅ [Unit Test Plan] Claude structured output received (no parsing needed):', {
                    hasStrategy: !!result.unit_test_strategy,
                    testSuitesCount: result.test_suites?.length || 0
                });
            } else {
                // Use OpenAI with structured outputs (JSON mode)
                console.log('[Unit Test Plan] Using OpenAI with structured outputs (JSON mode)...');
                const openaiProvider = this.providerFactory.getProvider('openai');
                const structuredResponse = await this.retryHandler.executeWithRetry(
                    async () => {
                        // Check for cancellation
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const response = await openaiProvider.sendStructuredRequest(
                            {
                                model: 'gpt-5.1',
                                systemPrompt: 'You are an expert test architect who creates comprehensive unit test plans. Return ONLY valid JSON matching the schema, no markdown, no code blocks, no other text.',
                                messages: [{
                                    role: 'user',
                                    content: prompt
                                }]
                            },
                            unitTestPlanSchema
                        );
                        
                        // Record request for rate limiting
                        this.rateLimiter.recordRequest('openai');
                        
                        return response;
                    }
                );

                result = structuredResponse.data;
                
                console.log('✅ [Unit Test Plan] OpenAI structured output received (no parsing needed):', {
                    hasStrategy: !!result.unit_test_strategy,
                    testSuitesCount: result.test_suites?.length || 0
                });
            }

            SWLogger.log('Unit test plan generated successfully');
            return result;
        } catch (error: any) {
            console.error('Error in generateUnitTestPlan:', error);
            throw new Error(`Failed to generate unit test plan: ${error.message || error}`);
        }
    }

    /**
     * Generate per-file test plan using enhanced analysis (two-stage approach)
     * This is the new enhanced method that uses AST parsing and detailed metadata
     */
    public async generatePerFileTestPlan(
        filePath: string,
        fileContent: string,
        functionMetadata: FunctionMetadata[],
        existingTests: string[],
        language: string,
        testFramework: string,
        projectSummary?: string,
        cancellationToken?: vscode.CancellationToken
    ): Promise<any> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }
        
        const isClaude = provider.getName() === 'claude';

        SWLogger.section('Per-File Test Plan Generation');
        SWLogger.log(`Generating test plan for: ${filePath}`);

        const prompt = this.promptBuilder.buildPerFileTestPlanPrompt(
            filePath,
            fileContent,
            functionMetadata,
            existingTests,
            language,
            testFramework,
            projectSummary
        );

        try {
            if (cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            await this.rateLimiter.waitUntilAvailable(provider.getName() as any);

            if (isClaude) {
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await provider.sendRequest({
                            model: 'claude-sonnet-4-5',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }],
                        });
                        
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        return llmResponse;
                    }
                );

                // Parse JSON from response
                const content = response.content || '';
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                throw new Error('No JSON found in response');
            } else {
                // OpenAI
                const openaiProvider = this.providerFactory.getProvider('openai');
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await openaiProvider.sendRequest({
                            model: 'gpt-5.1',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }],
                            responseFormat: { type: 'json_object' }
                        });
                        
                        this.rateLimiter.recordRequest('openai');
                        return llmResponse;
                    }
                );

                const content = response.content || '';
                try {
                    return JSON.parse(content);
                } catch (e) {
                    // Try to extract JSON from markdown code blocks
                    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[1]);
                    }
                    throw new Error('Failed to parse JSON from response');
                }
            }
        } catch (error: any) {
            console.error('Error in generatePerFileTestPlan:', error);
            throw new Error(`Failed to generate per-file test plan: ${error.message || error}`);
        }
    }

    /**
     * Generate test code from a test plan item (second stage of two-stage approach)
     */
    public async generateTestCodeFromPlan(
        testPlanItem: any,
        sourceCode: string,
        functionCode: string,
        language: string,
        testFramework: string,
        cancellationToken?: vscode.CancellationToken
    ): Promise<string> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }
        
        const isClaude = provider.getName() === 'claude';

        const prompt = this.promptBuilder.buildTestCodeGenerationPrompt(
            testPlanItem,
            sourceCode,
            functionCode,
            language,
            testFramework
        );

        try {
            if (cancellationToken?.isCancellationRequested) {
                throw new Error('Cancelled by user');
            }

            await this.rateLimiter.waitUntilAvailable(provider.getName() as any);

            if (isClaude) {
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await provider.sendRequest({
                            model: 'claude-sonnet-4-5',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }],
                        });
                        
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        return llmResponse;
                    }
                );

                const content = response.content || '';
                // Remove markdown code blocks if present
                return content.replace(/```[\w]*\n?/g, '').trim();
            } else {
                // OpenAI
                const openaiProvider = this.providerFactory.getProvider('openai');
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await openaiProvider.sendRequest({
                            model: 'gpt-5.1',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }]
                        });
                        
                        this.rateLimiter.recordRequest('openai');
                        return llmResponse;
                    }
                );

                const content = response.content || '';
                // Remove markdown code blocks if present
                return content.replace(/```[\w]*\n?/g, '').trim();
            }
        } catch (error: any) {
            console.error('Error in generateTestCodeFromPlan:', error);
            throw new Error(`Failed to generate test code: ${error.message || error}`);
        }
    }

    private detectPrimaryLanguage(context: AnalysisContext, codeAnalysis?: CodeAnalysis): string {
        // Count languages from files
        const languageCounts = new Map<string, number>();
        
        if (codeAnalysis && codeAnalysis.files) {
            for (const file of codeAnalysis.files) {
                const lang = file.language || 'unknown';
                if (lang !== 'unknown') {
                    languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
                }
            }
        }
        
        // Also check context files
        if (context.files) {
            for (const file of context.files) {
                const lang = file.language || 'unknown';
                if (lang !== 'unknown') {
                    languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
                }
            }
        }
        
        // Return the most common language, or default to typescript
        if (languageCounts.size === 0) {
            return 'typescript'; // Default fallback
        }
        
        const sorted = Array.from(languageCounts.entries()).sort((a, b) => b[1] - a[1]);
        return sorted[0][0];
    }

    private getTestingFrameworkForLanguage(language: string): string[] {
        const frameworkMap: { [key: string]: string[] } = {
            'python': ['pytest', 'unittest'],
            'typescript': ['jest', 'mocha', 'vitest'],
            'javascript': ['jest', 'mocha', 'vitest'],
            'java': ['junit', 'testng'],
            'cpp': ['googletest', 'catch2', 'doctest'],
            'c': ['unity', 'cmocka', 'check'],
            'go': ['testing', 'testify', 'ginkgo'],
            'rust': ['cargo test', 'criterion'],
            'ruby': ['rspec', 'minitest'],
            'php': ['phpunit', 'pest'],
        };
        return frameworkMap[language.toLowerCase()] || ['jest', 'mocha']; // Default to JS/TS frameworks
    }

    private buildUnitTestPlanPrompt(
        context: AnalysisContext,
        codeAnalysis?: CodeAnalysis,
        productDocs?: EnhancedProductDocumentation,
        architectureInsights?: LLMInsights
    ): string {
        // Detect primary language
        const primaryLanguage = this.detectPrimaryLanguage(context, codeAnalysis);
        const testingFrameworks = this.getTestingFrameworkForLanguage(primaryLanguage);
        let prompt = `You are an expert test architect. Generate a comprehensive unit test plan that tests ALL functions in this codebase to catch regressions.

## Codebase Statistics
- Total Files: ${context.totalFiles}
- Total Lines: ${context.totalLines}
- Total Functions: ${context.totalFunctions}
- Entry Points: ${context.entryPoints.length}
- Orphaned Files: ${context.orphanedFiles.length}

## Entry Points
${context.entryPoints.map(ep => `- ${ep.path} (${ep.type}): ${ep.reason}`).join('\n')}

## All Files and Their Functions
${codeAnalysis && codeAnalysis.files ? codeAnalysis.files
    .sort((a, b) => b.lines - a.lines)
    .map((f, i) => {
        const fileFunctions = codeAnalysis.functions.filter(func => func.file === f.path);
        const funcList = fileFunctions.length > 0 
            ? fileFunctions.map(func => `    - ${func.name} (lines ${func.startLine}-${func.endLine}, ${func.lines} lines)`)
            : ['    - (no functions detected)'];
        return `${i + 1}. ${f.path} (${f.language}, ${f.lines} lines, ${f.functions} functions)\n${funcList.join('\n')}`;
    }).join('\n\n') : context.files
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 50)
    .map((f, i) => `${i + 1}. ${f.path} - ${f.lines} lines, ${f.functions} functions`)
    .join('\n')}

## Function Details
${codeAnalysis && codeAnalysis.functions ? codeAnalysis.functions
    .slice(0, 100) // Limit to top 100 functions to avoid token limits
    .map((f, i) => `${i + 1}. ${f.name} in ${f.file} (${f.language}, lines ${f.startLine}-${f.endLine}, ${f.lines} lines)`)
    .join('\n') : 'No function details available'}

## File Dependencies and Imports
${codeAnalysis && codeAnalysis.imports ? Object.entries(codeAnalysis.imports)
    .slice(0, 50) // Limit to avoid token limits
    .map(([file, imports]) => `${file} imports: ${imports.slice(0, 10).join(', ')}${imports.length > 10 ? '...' : ''}`)
    .join('\n') : 'No import information available'}
`;

        if (productDocs) {
            prompt += `\n## Product Overview
${productDocs.overview || 'N/A'}

## What It Does
${productDocs.whatItDoes?.join('\n- ') || 'N/A'}

## Architecture Summary
${productDocs.architecture || 'N/A'}

## Key Functions and Modules
${productDocs.relevantFunctions && productDocs.relevantFunctions.length > 0 
    ? productDocs.relevantFunctions.slice(0, 30).map((f: any) => 
        `- ${f.name} (${f.file || f.module || 'unknown'}): ${f.description || 'N/A'}`
      ).join('\n')
    : 'N/A'}

## Key Data Structures
${productDocs.relevantDataStructures && productDocs.relevantDataStructures.length > 0
    ? productDocs.relevantDataStructures.slice(0, 20).map((ds: any) =>
        `- ${ds.name} (${ds.type || 'unknown'}): ${ds.description || 'N/A'}`
      ).join('\n')
    : 'N/A'}

## Important Code Files
${productDocs.relevantCodeFiles && productDocs.relevantCodeFiles.length > 0
    ? productDocs.relevantCodeFiles.slice(0, 30).map((cf: any) =>
        `- ${cf.path}: ${cf.purpose || cf.description || 'N/A'} (role: ${cf.role || 'N/A'})`
      ).join('\n')
    : 'N/A'}
`;
        }

        if (architectureInsights) {
            prompt += `\n## Architecture Insights
### Overall Assessment
${architectureInsights.overallAssessment || 'N/A'}

### Strengths
${architectureInsights.strengths?.slice(0, 10).join('\n- ') || 'N/A'}

### Critical Issues (Must Test)
${architectureInsights.issues?.slice(0, 10).map(i => {
    if (typeof i === 'string') return `- ${i}`;
    const files = i.relevantFiles && i.relevantFiles.length > 0 ? ` (files: ${i.relevantFiles.slice(0, 3).join(', ')})` : '';
    const funcs = i.relevantFunctions && i.relevantFunctions.length > 0 ? ` (functions: ${i.relevantFunctions.slice(0, 3).join(', ')})` : '';
    return `- ${i.title}: ${i.description}${files}${funcs}`;
}).join('\n') || 'N/A'}

### Success/Errors Analysis (CRITICAL FOR TEST GENERATION)
${(architectureInsights as any).successErrors || 'N/A'}

**IMPORTANT**: Use the Success/Errors section above to generate comprehensive tests:
- Test all success cases documented
- Test all expected failures and verify proper error handling
- Add tests for silent failure scenarios (these are critical to catch)
- Test fallback behaviors and verify they log appropriately
- Add logging assertions where silent failures or fallbacks are detected

### Recommendations (Test These Areas)
${architectureInsights.recommendations?.slice(0, 10).map(r => {
    if (typeof r === 'string') return `- ${r}`;
    const files = r.relevantFiles && r.relevantFiles.length > 0 ? ` (files: ${r.relevantFiles.slice(0, 3).join(', ')})` : '';
    const funcs = r.relevantFunctions && r.relevantFunctions.length > 0 ? ` (functions: ${r.relevantFunctions.slice(0, 3).join(', ')})` : '';
    return `- ${r.title}: ${r.description}${files}${funcs}`;
}).join('\n') || 'N/A'}

### High Priority Areas (Focus Testing Here)
${architectureInsights.priorities?.slice(0, 10).map(p => {
    if (typeof p === 'string') return `- ${p}`;
    const files = p.relevantFiles && p.relevantFiles.length > 0 ? ` (files: ${p.relevantFiles.slice(0, 3).join(', ')})` : '';
    const funcs = p.relevantFunctions && p.relevantFunctions.length > 0 ? ` (functions: ${p.relevantFunctions.slice(0, 3).join(', ')})` : '';
    return `- ${p.title}: ${p.description}${files}${funcs}`;
}).join('\n') || 'N/A'}
`;
        }

        // Determine test file extension based on language
        const testFileExt = primaryLanguage === 'python' ? '.py' :
                           primaryLanguage === 'cpp' || primaryLanguage === 'c' ? '.cpp' :
                           primaryLanguage === 'java' ? '.java' :
                           primaryLanguage === 'go' ? '.go' :
                           primaryLanguage === 'rust' ? '.rs' :
                           primaryLanguage === 'ruby' ? '.rb' :
                           primaryLanguage === 'php' ? '.php' :
                           '.ts'; // Default to TypeScript

        const testFileExample = primaryLanguage === 'python' ? 'tests/test_analyzer.py' :
                               primaryLanguage === 'cpp' ? 'tests/test_analyzer.cpp' :
                               primaryLanguage === 'java' ? 'src/test/TestAnalyzer.java' :
                               primaryLanguage === 'go' ? 'analyzer_test.go' :
                               primaryLanguage === 'rust' ? 'tests/test_analyzer.rs' :
                               'src/test/analyzer.test.ts';

        const runCommandExample = primaryLanguage === 'python' ? 'pytest tests/test_analyzer.py::test_function_name' :
                                 primaryLanguage === 'cpp' ? 'make test && ./tests/test_analyzer' :
                                 primaryLanguage === 'java' ? 'mvn test -Dtest=TestAnalyzer#testFunctionName' :
                                 primaryLanguage === 'go' ? 'go test -v -run TestFunctionName ./analyzer_test.go' :
                                 primaryLanguage === 'rust' ? 'cargo test test_function_name' :
                                 'npm test -- analyzer.test.ts -t test_function_name';

        prompt += `\n## Your Task

**IMPORTANT: This codebase is primarily written in ${primaryLanguage.toUpperCase()}. Generate tests in ${primaryLanguage.toUpperCase()}, NOT TypeScript.**

Generate a comprehensive unit test plan with EXECUTABLE TEST CODE in the following JSON structure:

{
  "unit_test_strategy": {
    "overall_approach": "string describing how to approach unit testing for ${primaryLanguage} codebase",
    "testing_frameworks": ${JSON.stringify(testingFrameworks)},
    "mocking_strategy": "how to mock dependencies in ${primaryLanguage}",
    "isolation_level": "what can be tested in isolation"
  },
  "test_suites": [
    {
      "id": "unique-id",
      "name": "Test suite name",
      "description": "what this suite tests",
      "test_file_path": "${testFileExample}",
      "source_files": ["src/analyzer${primaryLanguage === 'python' ? '.py' : primaryLanguage === 'cpp' ? '.cpp' : primaryLanguage === 'java' ? '.java' : primaryLanguage === 'go' ? '.go' : primaryLanguage === 'rust' ? '.rs' : '.ts'}"],
      "run_suite_instructions": "${primaryLanguage === 'python' ? 'pytest tests/test_analyzer.py' : primaryLanguage === 'cpp' ? 'make test' : primaryLanguage === 'java' ? 'mvn test' : primaryLanguage === 'go' ? 'go test ./...' : primaryLanguage === 'rust' ? 'cargo test' : 'npm test -- analyzer.test.ts'}",
      "test_cases": [
        {
          "id": "test-id",
          "name": "test_function_name",
          "description": "what this test verifies",
          "target_function": "function being tested",
          "target_file": "src/analyzer${primaryLanguage === 'python' ? '.py' : primaryLanguage === 'cpp' ? '.cpp' : primaryLanguage === 'java' ? '.java' : primaryLanguage === 'go' ? '.go' : primaryLanguage === 'rust' ? '.rs' : '.ts'}",
          "scenarios": ["scenario 1", "scenario 2"],
          "mocks": ["what to mock"],
          "assertions": ["what to assert"],
          "priority": "high|medium|low",
          "test_code": "Complete ${primaryLanguage.toUpperCase()} test code using ${testingFrameworks[0]}. Include all imports, setup, mocks, and assertions. Example format:\n${primaryLanguage === 'python' ? 'import pytest\nfrom analyzer import detect_entry_points\n\ndef test_detect_entry_points():\n    # Complete test implementation\n    assert result == expected' : primaryLanguage === 'cpp' ? '#include <gtest/gtest.h>\n#include \"analyzer.h\"\n\nTEST(AnalyzerTest, DetectEntryPoints) {\n    // Complete test implementation\n    EXPECT_EQ(result, expected);\n}' : '// Complete test code here'}",
          "run_instructions": "${runCommandExample}"
        }
      ]
    }
  ],
  "rationale": "why these unit tests matter"
}

## Critical Requirements:
1. **COMPREHENSIVE COVERAGE**: Create test suites that cover ALL major functions listed above. Every important function should have at least one test case. Focus on:
   - Entry point functions (${context.entryPoints.length} entry points listed above)
   - Functions mentioned in architecture insights (issues, recommendations, priorities)
   - Functions in key files from product documentation
   - All public/exported functions
   - Core business logic functions

2. **Test Language**: Write tests in ${primaryLanguage.toUpperCase()} (same language as the codebase). Use ${testingFrameworks[0]} or ${testingFrameworks[1] || 'appropriate framework'}.

3. **MANDATORY: Executable Test Code**: Each test_case MUST include complete, copy-paste-ready test_code in ${primaryLanguage.toUpperCase()}. This field is REQUIRED and cannot be null or empty. The test_code must:
   - **CRITICAL: Return ONLY plain source code text. NO HTML tags, NO markdown code blocks (no triple backticks), NO formatting markup. Just the raw executable code.**
   - Use the CORRECT import syntax for the actual code structure (check if it's a class, module, or function export)
   - Match the ACTUAL function signatures and parameter types from the codebase
   - Include all necessary imports and dependencies
   - Set up mocks properly (using ${primaryLanguage} mocking libraries)
   - Have actual, complete test implementation (NOT just comments or placeholders)
   - Use the testing framework from unit_test_strategy (${testingFrameworks[0]})
   - Be immediately runnable without any modification
   - Test the scenarios listed in the scenarios array
   - Include all assertions from the assertions array
   - Use correct property names (e.g., if Insight uses 'file' not 'filePath', 'description' not 'message')

4. **MANDATORY: Run Instructions**: Each test_case MUST include run_instructions with exact CLI commands for ${primaryLanguage}. This field is REQUIRED and cannot be null. Provide:
   - Exact command to run individual tests (run_instructions) - must be a complete, executable command
   - Exact command to run entire test suites (run_suite_instructions)

5. **Test File Paths**: Use ${primaryLanguage.toUpperCase()} test file paths (e.g., '${testFileExample}', with ${testFileExt} extension)

6. **Regression Prevention**: Tests should be comprehensive enough that if code changes break functionality, the tests will fail. Include:
   - Happy path tests
   - Edge cases (empty inputs, null values, boundary conditions)
   - Error handling (invalid inputs, missing dependencies)
   - Integration points (how functions interact)

7. **Use Context**: Leverage the product documentation, architecture insights, and function lists above to:
   - Understand what each function should do
   - Identify critical paths that need thorough testing
   - Focus on areas mentioned in architecture issues/priorities
   - Test functions that are part of key workflows

8. **Test Organization**: Group related tests into suites by:
   - Source file (one test suite per major source file)
   - Functionality area (e.g., "File Analysis", "Dependency Detection", "Entry Point Detection")
   - Module/component boundaries

9. **Mocking Strategy**: Mock external dependencies like:
   - File system operations
   - Network/HTTP calls
   - Database access
   - VSCode API (if applicable)
   - Third-party libraries

10. **Test Storage Location**: The unit test plan will be saved to the \`.shadow/UnitTests/\` folder. Users can reference this location when asking LLMs to help run or modify the tests.

11. **Test Quality**: Each test should:
    - Have a clear, descriptive name
    - Test one specific behavior
    - Be independent (can run in any order)
    - Be fast (no slow I/O unless necessary)
    - Have clear assertions that verify expected behavior

Return ONLY the JSON object, no other text.`;

        return prompt;
    }

    /**
     * Generate comprehensive refactoring report combining workspace, product, and architecture data
     */
    public async generateComprehensiveReport(
        context: AnalysisContext,
        codeAnalysis?: CodeAnalysis,
        productDocs?: EnhancedProductDocumentation,
        architectureInsights?: LLMInsights,
        cancellationToken?: vscode.CancellationToken
    ): Promise<string> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }
        
        const isClaude = provider.getName() === 'claude';

        // Analyze functions for detailed refactoring information
        let functionAnalyses;
        if (codeAnalysis) {
            try {
                functionAnalyses = await this.functionAnalyzer.analyzeFunctions(codeAnalysis);
                SWLogger.log(`Analyzed ${functionAnalyses.length} functions for refactoring report`);
            } catch (error) {
                console.warn('Failed to analyze functions, proceeding without detailed function data:', error);
                functionAnalyses = undefined;
            }
        }

        const prompt = this.buildComprehensiveReportPrompt(
            context, 
            codeAnalysis, 
            productDocs, 
            architectureInsights,
            functionAnalyses
        );

        try {
            // Wait for rate limit if needed
            await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
            
            if (isClaude) {
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await provider.sendRequest({
                            model: 'claude-sonnet-4-5',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }],
                        });
                        
                        // Record request for rate limiting
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        
                        return llmResponse;
                    }
                );

                if (cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }

                return response.content;
            } else {
                // OpenAI fallback
                const openaiProvider = this.providerFactory.getProvider('openai');
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await (openaiProvider as any).sendRequestWithFallback(
                            {
                                model: 'gpt-5.1',
                                messages: [{ role: 'user', content: prompt }],
                            },
                            ['gpt-5.1', 'gpt-5', 'gpt-4o', 'gpt-4-turbo']
                        );
                        
                        // Record request for rate limiting
                        this.rateLimiter.recordRequest('openai');
                        
                        return llmResponse;
                    }
                );

                if (cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }

                return response.content;
            }
        } catch (error: any) {
            if (error.message === 'Cancelled by user') {
                throw error;
            }
            console.error('Error generating comprehensive report:', error);
            throw new Error(`Failed to generate comprehensive report: ${error.message}`);
        }
    }

    private buildComprehensiveReportPrompt(
        context: AnalysisContext,
        codeAnalysis?: CodeAnalysis,
        productDocs?: EnhancedProductDocumentation,
        architectureInsights?: LLMInsights,
        functionAnalyses?: FunctionAnalysis[]
    ): string {
        // Use the enhanced refactoring prompt builder
        return this.refactoringPromptBuilder.buildDetailedRefactoringPrompt(
            context,
            codeAnalysis || {
                totalFiles: context.totalFiles,
                totalLines: context.totalLines,
                totalFunctions: context.totalFunctions,
                largeFiles: context.largeFiles,
                files: context.files,
                functions: [],
                imports: context.imports,
                importedFiles: context.importedFiles,
                orphanedFiles: context.orphanedFiles,
                entryPoints: context.entryPoints
            },
            productDocs,
            architectureInsights,
            functionAnalyses
        );
    }

    /**
     * Legacy prompt builder (kept for backward compatibility)
     * @deprecated Use RefactoringPromptBuilder instead
     */
    private buildComprehensiveReportPromptLegacy(
        context: AnalysisContext,
        codeAnalysis?: CodeAnalysis,
        productDocs?: EnhancedProductDocumentation,
        architectureInsights?: LLMInsights
    ): string {
        let prompt = `You are an expert software architect and refactoring specialist. Generate a comprehensive refactoring report that provides actionable recommendations to reduce complexity, eliminate duplication, and improve code efficiency.

## Codebase Statistics
- Total Files: ${context.totalFiles}
- Total Lines: ${context.totalLines}
- Total Functions: ${context.totalFunctions}
- Entry Points: ${context.entryPoints.length}
- Orphaned Files: ${context.orphanedFiles.length}
- Large Files (>500 lines): ${context.largeFiles}

## Entry Points
${context.entryPoints.map(ep => `- ${ep.path} (${ep.type}): ${ep.reason}`).join('\n')}

## Key Files and Functions
${codeAnalysis && codeAnalysis.files ? codeAnalysis.files
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 50)
    .map((f, i) => {
        const fileFunctions = codeAnalysis.functions.filter(func => func.file === f.path);
        const funcList = fileFunctions.length > 0
            ? fileFunctions.map(func => `    - ${func.name} (lines ${func.startLine}-${func.endLine}, ${func.lines} lines)`)
            : ['    - (no functions detected)'];
        return `${i + 1}. ${f.path} (${f.language}, ${f.lines} lines, ${f.functions} functions)\n${funcList.join('\n')}`;
    }).join('\n\n') : context.files
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 50)
    .map((f, i) => `${i + 1}. ${f.path} - ${f.lines} lines, ${f.functions} functions`)
    .join('\n')}
`;

        if (productDocs) {
            prompt += `\n## Product Overview
${productDocs.overview || 'N/A'}

## What It Does
${productDocs.whatItDoes?.join('\n- ') || 'N/A'}

## Architecture Summary
${productDocs.architecture || 'N/A'}

## Key Modules
${productDocs.modules && productDocs.modules.length > 0
    ? productDocs.modules.map(m => `- ${m.module} (${m.moduleType}): ${m.summary || 'N/A'}`).join('\n')
    : 'N/A'}
`;
        }

        if (architectureInsights) {
            prompt += `\n## Architecture Assessment
${architectureInsights.overallAssessment || 'N/A'}

### Strengths
${architectureInsights.strengths?.slice(0, 10).join('\n- ') || 'N/A'}

### Critical Issues
${architectureInsights.issues?.slice(0, 10).map(i => {
    if (typeof i === 'string') return `- ${i}`;
    return `- ${i.title}: ${i.description}`;
}).join('\n') || 'N/A'}

### Recommendations
${architectureInsights.recommendations?.slice(0, 10).map(r => {
    if (typeof r === 'string') return `- ${r}`;
    return `- ${r.title}: ${r.description}`;
}).join('\n') || 'N/A'}

### Priorities
${architectureInsights.priorities?.slice(0, 10).map(p => {
    if (typeof p === 'string') return `- ${p}`;
    return `- ${p.title}: ${p.description}`;
}).join('\n') || 'N/A'}
`;
        }

        prompt += `\n## Your Task

Generate a comprehensive refactoring report in **Markdown format** (NOT HTML) that addresses:

1. **Complexity Reduction**
   - Identify overly complex functions, files, and modules
   - Recommend specific refactoring techniques (extract functions, split classes, simplify logic)
   - Prioritize by impact and effort

2. **Duplication Elimination**
   - Identify duplicate code patterns
   - Suggest consolidation strategies
   - Recommend shared utilities or abstractions

3. **Efficiency Improvements**
   - Identify performance bottlenecks
   - Suggest optimizations
   - Recommend better algorithms or data structures

4. **Code Organization**
   - Suggest better file/folder structure
   - Recommend module boundaries
   - Suggest dependency improvements

5. **Actionable Recommendations**
   - Provide specific, implementable suggestions
   - Include file paths and function names where relevant
   - Prioritize recommendations by impact
   - Estimate effort for each recommendation

## Report Structure

Your report should be in Markdown format with the following sections:

# Comprehensive Refactoring Report

## Executive Summary
(Brief overview of key findings and priorities)

## Complexity Analysis
(Detailed analysis of complexity issues with specific recommendations)

## Duplication Analysis
(Identified duplications and consolidation strategies)

## Efficiency Recommendations
(Performance improvements and optimizations)

## Code Organization
(Structural improvements and reorganization suggestions)

## Prioritized Action Plan
(Ranked list of recommendations with effort estimates)

## Implementation Roadmap
(Suggested order of implementation)

---

**IMPORTANT**: 
- Use Markdown formatting (headers, lists, code blocks, etc.)
- Do NOT use HTML tags
- Be specific with file paths and function names
- Provide actionable, implementable recommendations
- Prioritize by impact and feasibility

Return ONLY the Markdown report, no additional text or explanations.`;

        return prompt;
    }

    /**
     * Generate product documentation report
     */
    public async generateProductReport(
        productDocs: EnhancedProductDocumentation,
        context?: AnalysisContext,
        cancellationToken?: vscode.CancellationToken
    ): Promise<string> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }
        
        const isClaude = provider.getName() === 'claude';
        const prompt = this.buildProductReportPrompt(productDocs, context);

        try {
            await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
            
            if (isClaude) {
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await provider.sendRequest({
                            model: 'claude-sonnet-4-5',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }],
                        });
                        
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        return llmResponse;
                    }
                );

                if (cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }

                return response.content;
            } else {
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await provider.sendRequest({
                            model: 'gpt-5.1',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }],
                        });
                        
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        return llmResponse;
                    }
                );

                if (cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }

                return response.content;
            }
        } catch (error: any) {
            SWLogger.log(`Error generating product report: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate architecture insights report
     */
    public async generateArchitectureReport(
        architectureInsights: LLMInsights,
        context?: AnalysisContext,
        codeAnalysis?: CodeAnalysis,
        cancellationToken?: vscode.CancellationToken
    ): Promise<string> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }
        
        const isClaude = provider.getName() === 'claude';
        const prompt = this.buildArchitectureReportPrompt(architectureInsights, context, codeAnalysis);

        try {
            await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
            
            if (isClaude) {
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await provider.sendRequest({
                            model: 'claude-sonnet-4-5',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }],
                        });
                        
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        return llmResponse;
                    }
                );

                if (cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }

                return response.content;
            } else {
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await provider.sendRequest({
                            model: 'gpt-5.1',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }],
                        });
                        
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        return llmResponse;
                    }
                );

                if (cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }

                return response.content;
            }
        } catch (error: any) {
            SWLogger.log(`Error generating architecture report: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate workspace analysis report
     */
    public async generateWorkspaceReport(
        context: AnalysisContext,
        codeAnalysis: CodeAnalysis,
        cancellationToken?: vscode.CancellationToken
    ): Promise<string> {
        const provider = this.providerFactory.getCurrentProvider();
        if (!provider.isConfigured()) {
            throw new Error('LLM API key not configured');
        }
        
        const isClaude = provider.getName() === 'claude';
        const prompt = this.buildWorkspaceReportPrompt(context, codeAnalysis);

        try {
            await this.rateLimiter.waitUntilAvailable(provider.getName() as any);
            
            if (isClaude) {
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await provider.sendRequest({
                            model: 'claude-sonnet-4-5',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }],
                        });
                        
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        return llmResponse;
                    }
                );

                if (cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }

                return response.content;
            } else {
                const response = await this.retryHandler.executeWithRetry(
                    async () => {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }
                        
                        const llmResponse = await provider.sendRequest({
                            model: 'gpt-5.1',
                            messages: [{
                                role: 'user',
                                content: prompt
                            }],
                        });
                        
                        this.rateLimiter.recordRequest(provider.getName() as any);
                        return llmResponse;
                    }
                );

                if (cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }

                return response.content;
            }
        } catch (error: any) {
            SWLogger.log(`Error generating workspace report: ${error.message}`);
            throw error;
        }
    }

    private buildProductReportPrompt(
        productDocs: EnhancedProductDocumentation,
        context?: AnalysisContext
    ): string {
        let prompt = `You are an expert technical writer and product documentation specialist. Generate a comprehensive product documentation report in **Markdown format** (NOT HTML) that consolidates and presents all product information in a clear, structured way.

## Product Documentation Data

### Overview
${productDocs.overview || 'N/A'}

### What It Does
${productDocs.whatItDoes?.map(item => `- ${item}`).join('\n') || 'N/A'}

### User Perspective
${productDocs.userPerspective ? `
- GUI: ${productDocs.userPerspective.gui?.join(', ') || 'N/A'}
- CLI: ${productDocs.userPerspective.cli?.join(', ') || 'N/A'}
- API: ${productDocs.userPerspective.api?.join(', ') || 'N/A'}
- CI/CD: ${productDocs.userPerspective.cicd?.join(', ') || 'N/A'}
` : 'N/A'}

### Problems Solved
${productDocs.problemsSolved?.map(p => `- ${p}`).join('\n') || 'N/A'}

### Architecture
${productDocs.architecture || 'N/A'}

${productDocs.componentDiagram ? `### Component Diagram\n\`\`\`mermaid\n${productDocs.componentDiagram}\n\`\`\`\n` : ''}
${productDocs.flowDiagram ? `### Flow Diagram\n\`\`\`mermaid\n${productDocs.flowDiagram}\n\`\`\`\n` : ''}

### Key Features & Modules
${productDocs.descriptions?.map(d => `- **${d.title}**${d.category ? ` (${d.category})` : ''}: ${d.description}`).join('\n') || productDocs.features?.map(f => `- ${f}`).join('\n') || 'N/A'}

### Relevant Functions
${productDocs.relevantFunctions?.map(f => `- **${f.name}**${f.file ? ` (${f.file})` : ''}: ${f.description}`).join('\n') || 'N/A'}

### Relevant Data Structures
${productDocs.relevantDataStructures?.map(d => `- **${d.name}**${d.type ? ` (${d.type})` : ''}${d.file ? ` in ${d.file}` : ''}: ${d.description}`).join('\n') || 'N/A'}

### Code Files
${productDocs.relevantCodeFiles?.map(f => `- **${f.path}**: ${f.description}${f.purpose ? ` - Purpose: ${f.purpose}` : ''}${f.role ? ` - Role: ${f.role}` : ''}`).join('\n') || 'N/A'}

### Modules
${productDocs.modules?.map(m => `
#### ${m.module}
- Type: ${m.moduleType}
- Summary: ${m.summary}
- Capabilities: ${m.capabilities?.join(', ') || 'N/A'}
- Files: ${m.files?.length || 0} files
`).join('\n') || 'N/A'}

${context ? `### Workspace Context
- Total Files: ${context.totalFiles}
- Total Lines: ${context.totalLines}
- Total Functions: ${context.totalFunctions}
` : ''}

## Your Task

Generate a comprehensive product documentation report in **Markdown format** that:

1. **Consolidates** all the product information above into a well-organized report
2. **Explains** what the product does from a user's perspective
3. **Documents** the architecture and key components
4. **Describes** workflows and integration points
5. **Lists** key features, functions, and data structures
6. **Provides** clear navigation through modules and components

## Report Structure

Your report should be in Markdown format with the following sections:

# Product Documentation Report

## Executive Summary
(Brief overview of what the product is and what it does)

## Product Overview
(Detailed description of the product, its purpose, and value proposition)

## What It Does
(Comprehensive list of capabilities and features)

## User Perspective
(How users interact with the product - GUI, CLI, API, CI/CD)

## Problems Solved
(Key problems and challenges the product addresses)

## Architecture Overview
(High-level architecture description and diagrams)

## Key Components & Modules
(Detailed breakdown of modules, their purposes, and relationships)

## Key Functions & Data Structures
(Important functions and data structures with their purposes)

## Workflows & Integration
(How the product integrates into user workflows)

## File Organization
(Overview of code file organization and their roles)

---

**IMPORTANT**: 
- Use Markdown formatting (headers, lists, code blocks, etc.)
- Do NOT use HTML tags
- Include all relevant information from the data above
- Organize information logically and clearly
- Make it easy to navigate and understand

Return ONLY the Markdown report, no additional text or explanations.`;

        return prompt;
    }

    private buildArchitectureReportPrompt(
        architectureInsights: LLMInsights,
        context?: AnalysisContext,
        codeAnalysis?: CodeAnalysis
    ): string {
        let prompt = `You are an expert software architect. Generate a comprehensive architecture analysis report in **Markdown format** (NOT HTML) that consolidates and presents all architectural insights in a clear, structured way.

## Architecture Insights Data

### Overall Assessment
${architectureInsights.overallAssessment || 'N/A'}

### Strengths
${architectureInsights.strengths?.map(s => `- ${s}`).join('\n') || 'N/A'}

### Issues
${this.formatInsightItems(architectureInsights.issues)}

### Organization
${architectureInsights.organization || 'N/A'}

### Entry Points Analysis
${architectureInsights.entryPointsAnalysis || 'N/A'}

### Orphaned Files Analysis
${architectureInsights.orphanedFilesAnalysis || 'N/A'}

### Folder Reorganization
${architectureInsights.folderReorganization || 'N/A'}

### Recommendations
${this.formatInsightItems(architectureInsights.recommendations)}

### Priorities
${this.formatInsightItems(architectureInsights.priorities)}

${context ? `### Workspace Context
- Total Files: ${context.totalFiles}
- Total Lines: ${context.totalLines}
- Total Functions: ${context.totalFunctions}
- Large Files: ${context.largeFiles}
- Entry Points: ${context.entryPoints.length}
- Orphaned Files: ${context.orphanedFiles.length}
` : ''}

${codeAnalysis ? `### Code Analysis Summary
- Total Files Analyzed: ${codeAnalysis.totalFiles}
- Total Lines: ${codeAnalysis.totalLines}
- Total Functions: ${codeAnalysis.totalFunctions}
- Large Files (>500 lines): ${codeAnalysis.largeFiles}
- Circular Dependencies: ${codeAnalysis.imports ? Object.keys(codeAnalysis.imports).length : 0} files with imports
` : ''}

## Your Task

Generate a comprehensive architecture analysis report in **Markdown format** that:

1. **Assesses** the overall architecture quality and health
2. **Identifies** architectural strengths and patterns
3. **Documents** architectural issues and concerns
4. **Provides** specific recommendations for improvement
5. **Prioritizes** architectural work based on impact
6. **Suggests** organizational improvements

## Report Structure

Your report should be in Markdown format with the following sections:

# Architecture Analysis Report

## Executive Summary
(Brief overview of architecture health, key strengths, and critical issues)

## Overall Assessment
(Comprehensive assessment of the architecture)

## Architectural Strengths
(Key strengths, patterns, and well-designed aspects)

## Architectural Issues & Concerns
(Detailed list of issues with specific files, functions, and impacts)

## Organization Analysis
(Analysis of code organization and structure)

## Entry Points & Dependencies
(Analysis of entry points and dependency structure)

## Recommendations
(Specific, actionable recommendations for architectural improvements)

## Prioritized Action Plan
(Ranked list of architectural improvements with priorities)

## Folder Reorganization Suggestions
(Specific suggestions for improving folder structure)

---

**IMPORTANT**: 
- Use Markdown formatting (headers, lists, code blocks, etc.)
- Do NOT use HTML tags
- Be specific with file paths and function names
- Provide actionable recommendations
- Prioritize by impact and feasibility

Return ONLY the Markdown report, no additional text or explanations.`;

        return prompt;
    }

    private buildWorkspaceReportPrompt(
        context: AnalysisContext,
        codeAnalysis: CodeAnalysis
    ): string {
        let prompt = `You are an expert code analyst. Generate a comprehensive workspace analysis report in **Markdown format** (NOT HTML) that presents codebase statistics and analysis in a clear, structured way.

## Workspace Analysis Data

### Statistics
- Total Files: ${context.totalFiles}
- Total Lines: ${context.totalLines}
- Total Functions: ${context.totalFunctions}
- Large Files (>500 lines): ${context.largeFiles}

### Files
${context.files.slice(0, 50).map(f => `- **${f.path}**: ${f.lines} lines, ${f.functions} functions (${f.language})`).join('\n')}
${context.files.length > 50 ? `\n... and ${context.files.length - 50} more files\n` : ''}

### Entry Points
${context.entryPoints.map(ep => `- **${ep.path}** (${ep.type}): ${ep.reason}`).join('\n') || 'N/A'}

### Orphaned Files
${context.orphanedFiles.length > 0 ? context.orphanedFiles.map(f => `- ${f}`).join('\n') : 'None detected'}

### Import Dependencies
${Object.entries(context.imports).slice(0, 20).map(([file, deps]) => `- **${file}** imports: ${deps.slice(0, 5).join(', ')}${deps.length > 5 ? ` ... and ${deps.length - 5} more` : ''}`).join('\n')}
${Object.keys(context.imports).length > 20 ? `\n... and ${Object.keys(context.imports).length - 20} more files with imports\n` : ''}

### Code Analysis Details
- Total Files Analyzed: ${codeAnalysis.totalFiles}
- Total Lines: ${codeAnalysis.totalLines}
- Total Functions: ${codeAnalysis.totalFunctions}
- Large Files: ${codeAnalysis.largeFiles}

### Large Files
${codeAnalysis.files.filter(f => f.lines > 500).slice(0, 20).map(f => `- **${f.path}**: ${f.lines} lines, ${f.functions} functions`).join('\n')}
${codeAnalysis.files.filter(f => f.lines > 500).length > 20 ? `\n... and ${codeAnalysis.files.filter(f => f.lines > 500).length - 20} more large files\n` : ''}

### Functions
${codeAnalysis.functions.slice(0, 30).map(f => `- **${f.name}** in ${f.file}: ${f.lines} lines (${f.startLine}-${f.endLine})`).join('\n')}
${codeAnalysis.functions.length > 30 ? `\n... and ${codeAnalysis.functions.length - 30} more functions\n` : ''}

## Your Task

Generate a comprehensive workspace analysis report in **Markdown format** that:

1. **Summarizes** codebase statistics and metrics
2. **Identifies** large files and complexity hotspots
3. **Documents** entry points and their purposes
4. **Analyzes** dependency structure
5. **Highlights** orphaned files and potential issues
6. **Provides** insights into code organization

## Report Structure

Your report should be in Markdown format with the following sections:

# Workspace Analysis Report

## Executive Summary
(Brief overview of codebase size, complexity, and key findings)

## Codebase Statistics
(Total files, lines, functions, and key metrics)

## File Analysis
(Overview of files, languages, and sizes)

## Large Files & Complexity
(Identification of large files and complexity hotspots)

## Entry Points
(Analysis of entry points and their purposes)

## Dependency Structure
(Analysis of import dependencies and relationships)

## Orphaned Files
(Identification and analysis of orphaned files)

## Code Organization Insights
(Insights into code organization and structure)

## Recommendations
(Suggestions for improving code organization and reducing complexity)

---

**IMPORTANT**: 
- Use Markdown formatting (headers, lists, code blocks, etc.)
- Do NOT use HTML tags
- Be specific with file paths and metrics
- Provide actionable insights

Return ONLY the Markdown report, no additional text or explanations.`;

        return prompt;
    }

    private formatInsightItems(items: (LLMInsightItem | string)[] | undefined): string {
        if (!items || items.length === 0) return 'N/A';
        
        return items.map(item => {
            if (typeof item === 'string') {
                return `- ${item}`;
            } else {
                let formatted = `- **${item.title}**: ${item.description}`;
                if (item.relevantFiles && item.relevantFiles.length > 0) {
                    formatted += `\n  - Files: ${item.relevantFiles.join(', ')}`;
                }
                if (item.relevantFunctions && item.relevantFunctions.length > 0) {
                    formatted += `\n  - Functions: ${item.relevantFunctions.join(', ')}`;
                }
                return formatted;
            }
        }).join('\n');
    }
}

