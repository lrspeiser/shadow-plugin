/**
 * LLM Service for calling OpenAI/Claude to generate intelligent insights
 */
import * as vscode from 'vscode';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { FileSummary, ModuleSummary, EnhancedProductDocumentation, detectFileRole, groupFilesByModule, detectModuleType, readFileContent } from './fileDocumentation';
import { CodeAnalysis, FileInfo } from './analyzer';
import { productPurposeAnalysisSchema, llmInsightsSchema, productDocumentationSchema, unitTestPlanSchema } from './llmSchemas';
import { FileAccessHelper, LLMRequest } from './fileAccessHelper';
import { SWLogger } from './logger';
import { getConfigurationManager, LLMProvider as ConfigLLMProvider } from './config/configurationManager';

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


type LLMProvider = 'openai' | 'claude';

export class LLMService {
    private openaiClient: OpenAI | null = null;
    private claudeClient: Anthropic | null = null;
    private openaiApiKey: string | null = null;
    private claudeApiKey: string | null = null;
    private provider: LLMProvider = 'openai'; // Default to OpenAI for backward compatibility
    private onConfigurationChange: (() => void) | null = null;
    private configManager = getConfigurationManager();

    constructor() {
        this.updateApiKeys();
        
        // Listen for configuration changes via ConfigurationManager
        this.configManager.onConfigurationChange(() => {
            this.updateApiKeys();
            // Notify listeners that configuration changed
            if (this.onConfigurationChange) {
                this.onConfigurationChange();
            }
        });
    }

    public setOnConfigurationChange(callback: () => void): void {
        this.onConfigurationChange = callback;
    }

    private updateApiKeys() {
        // Get provider preference
        this.provider = this.configManager.llmProvider;
        
        // Update OpenAI client
        const openaiKey = this.configManager.openaiApiKey;
        if (openaiKey && openaiKey.length > 0) {
            this.openaiApiKey = openaiKey;
            this.openaiClient = new OpenAI({
                apiKey: this.openaiApiKey,
                timeout: 300000 // 5 minutes
            });
        } else {
            this.openaiApiKey = null;
            this.openaiClient = null;
        }
        
        // Update Claude client
        const claudeKey = this.configManager.claudeApiKey;
        if (claudeKey && claudeKey.length > 0) {
            this.claudeApiKey = claudeKey;
            this.claudeClient = new Anthropic({
                apiKey: this.claudeApiKey,
                timeout: 300000 // 5 minutes
            });
        } else {
            this.claudeApiKey = null;
            this.claudeClient = null;
        }
    }

    public isConfigured(): boolean {
        if (this.provider === 'claude') {
            return this.claudeClient !== null;
        }
        return this.openaiClient !== null;
    }

    public getProvider(): LLMProvider {
        return this.provider;
    }

    public async promptForApiKey(provider?: LLMProvider): Promise<boolean> {
        const targetProvider = provider || this.provider;
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
            if (!provider && targetProvider !== this.provider) {
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
        // Product docs generation currently uses OpenAI (can be extended to Claude later)
        SWLogger.section('Product Docs: Start');
        SWLogger.log(`Files: ${analysis.files.length}, EntryPoints: ${analysis.entryPoints.length}`);
        if (!this.openaiClient) {
            throw new Error('OpenAI API key not configured');
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
                console.error(`Failed to analyze file ${file.path}:`, error);
                SWLogger.log(`ERROR analyzing file ${file.path}: ${(error as any)?.message || error}`);
                // Create basic summary as fallback
                const fallbackSummary = {
                    file: file.path,
                    role: detectFileRole(file.path, file),
                    purpose: 'Analysis failed',
                    userVisibleActions: [],
                    developerVisibleActions: [],
                    keyFunctions: [],
                    dependencies: [],
                    intent: 'Could not analyze this file'
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
        // File analysis currently uses OpenAI (can be extended to Claude later)
        if (!this.openaiClient) {
            throw new Error('OpenAI API key not configured');
        }

        const fileContent = await readFileContent(file.path, workspaceRoot);
        const role = detectFileRole(file.path, file);

        const prompt = this.buildFileAnalysisPrompt(file, fileContent || '', role);

        const response = await this.openaiClient.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert code analyst who extracts user-facing and developer-facing behavior from code files. Focus on WHAT the code does from a user perspective, not implementation details.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_completion_tokens: 40000
        });

        const content = response.choices[0].message.content || '';
        return this.parseFileSummary(content, file.path, role);
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
        // Module rollups currently use OpenAI (can be extended to Claude later)
        if (!this.openaiClient) {
            throw new Error('OpenAI API key not configured');
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
            const prompt = this.buildModuleRollupPrompt(modulePath, moduleType, moduleFiles);

            try {
                const response = await this.openaiClient.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert technical writer who creates module-level summaries from file-level documentation. Focus on user-facing capabilities and workflows.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_completion_tokens: 40000
                });

                const content = response.choices[0].message.content || '';
                const summary = this.parseModuleSummary(content, modulePath, moduleType, moduleFiles);
                moduleSummaries.push(summary);
                
                // Call incremental save callback
                if (callbacks?.onModuleSummary) {
                    callbacks.onModuleSummary(summary, moduleSummaries.length, modules.size);
                }
            } catch (error) {
                console.error(`Failed to generate module summary for ${modulePath}:`, error);
                SWLogger.log(`ERROR module summary ${modulePath}: ${(error as any)?.message || error}`);
                const fallbackSummary = {
                    module: modulePath,
                    moduleType: moduleType,
                    capabilities: [],
                    summary: 'Module analysis failed',
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
        const provider = this.configManager.llmProvider;
        const isClaude = provider === 'claude';

        if (isClaude) {
            if (!this.claudeClient) {
                throw new Error('Claude API key not configured');
            }
        } else {
            if (!this.openaiClient) {
                throw new Error('OpenAI API key not configured');
            }
        }

        const fileAccessHelper = new FileAccessHelper(workspaceRoot);
        let basePrompt = this.buildProductLevelPrompt(fileSummaries, moduleSummaries, analysis, fileAccessHelper);
        const messages: any[] = [];
        let iteration = 0;
        const maxIterations = 3;
        let finalResult: any = null;

        while (iteration < maxIterations) {
            iteration++;
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

            let response: any;
            if (isClaude) {
                // Use Claude with structured outputs for guaranteed JSON
                console.log('[Product Documentation] Using Claude with structured outputs...');
                response = await (this.claudeClient as any).beta.messages.create({
                    model: 'claude-sonnet-4-5',
                    max_tokens: 40000,
                    betas: ['structured-outputs-2025-11-13'],
                    system: 'You are an expert product documentation writer who creates user-facing product documentation from code analysis. Your job is to describe what THIS SPECIFIC application does for users, not how it\'s built. NEVER mention file paths, folder structures, or technical implementation details. Focus on user functionality, workflows, and problems solved. Be specific to the application being analyzed, not generic.',
                    messages: messages,
                    output_format: {
                        type: 'json_schema',
                        schema: productDocumentationSchema
                    }
                });
                SWLogger.log('Claude response received (product docs)');

                const textContent = response.content[0].text;
                if (!textContent) {
                    throw new Error('No text content in Claude response');
                }
                finalResult = JSON.parse(textContent);
            } else {
                // Use OpenAI with JSON mode
                response = await this.openaiClient!.chat.completions.create({
                    model: 'gpt-5.1',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert product documentation writer who creates user-facing product documentation from code analysis. Your job is to describe what THIS SPECIFIC application does for users, not how it\'s built. NEVER mention file paths, folder structures, or technical implementation details. Focus on user functionality, workflows, and problems solved. Be specific to the application being analyzed, not generic. You MUST respond with valid JSON only, no markdown, no code blocks.'
                        },
                        ...messages
                    ],
                    response_format: { type: 'json_object' },
                    max_completion_tokens: 40000
                });
                SWLogger.log('OpenAI response received (product docs)');

                const content = response.choices[0].message.content || '';
                finalResult = JSON.parse(content);
            }

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

            // Limit to 5 requests per iteration
            const limitedRequests = requests.slice(0, 5);
            console.log(`[Product Documentation] Processing ${limitedRequests.length} request(s) in iteration ${iteration}`);
            SWLogger.log(`Processing ${limitedRequests.length} request(s)`);

            // Process requests
            let additionalInfo = '\n## Additional Information Requested\n\n';
            const fileRequests = limitedRequests.filter(r => r.type === 'file') as any[];
            const grepRequests = limitedRequests.filter(r => r.type === 'grep') as any[];

            // Read requested files
            if (fileRequests.length > 0) {
                const filePaths = fileRequests.map(r => r.path);
                const fileResponses = fileAccessHelper.readFiles(filePaths);
                additionalInfo += fileAccessHelper.formatFileResponses(fileResponses);
            }

            // Execute grep searches
            if (grepRequests.length > 0) {
                const grepResponses = grepRequests.map(req => 
                    fileAccessHelper.grep(req.pattern, req.filePattern, req.maxResults || 20)
                );
                additionalInfo += fileAccessHelper.formatGrepResponses(grepResponses);
            }

            // Add assistant response and additional info to conversation
            messages.push({
                role: 'assistant',
                content: JSON.stringify(finalResult)
            });
            messages.push({
                role: 'user',
                content: additionalInfo
            });
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
        // Product docs generation currently uses OpenAI (can be extended to Claude later)
        if (!this.openaiClient) {
            throw new Error('OpenAI API key not configured');
        }

        const prompt = this.buildProductDocsPrompt(context);

        const response = await this.openaiClient.chat.completions.create({
            model: 'gpt-5.1',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert technical writer who creates clear, comprehensive product documentation from code analysis.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_completion_tokens: 40000
        });

        const content = response.choices[0].message.content || '';
        console.log('Product Docs LLM Response (first 1000 chars):', content.substring(0, 1000));
        const parsed = this.parseProductDocs(content);
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
        const isClaude = this.provider === 'claude';
        
        if (isClaude && !this.claudeClient) {
            throw new Error('Claude API key not configured');
        }
        if (!isClaude && !this.openaiClient) {
            throw new Error('OpenAI API key not configured');
        }

        const prompt = this.buildProductPurposePrompt(productDocs, context);
        const providerName = isClaude ? 'Claude' : 'OpenAI';
        console.log(`[Product Purpose] Using ${providerName} provider`);
        console.log('Product Purpose Analysis prompt length:', prompt.length);

        try {
            if (isClaude) {
                // Use Claude with structured outputs - NO PARSING NEEDED!
                console.log('[Product Purpose] Using Claude with structured outputs...');
                // Structured outputs is a beta feature
                const response = await (this.claudeClient as any).beta.messages.create({
                    model: 'claude-sonnet-4-5',
                    max_tokens: 8000,
                    betas: ['structured-outputs-2025-11-13'],
                    system: 'You are an expert software architect who understands how product goals and user needs shape architecture decisions.',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    output_format: {
                        type: 'json_schema',
                        schema: productPurposeAnalysisSchema
                    }
                });

                // Claude structured outputs return valid JSON directly - no parsing needed!
                const textContent = response.content[0].text;
                if (!textContent) {
                    throw new Error('No text content in Claude response');
                }
                const structuredOutput = JSON.parse(textContent);
                console.log('✅ [Product Purpose] Claude structured output received (no parsing needed)');
                return structuredOutput as ProductPurposeAnalysis;
            } else {
                // Use OpenAI with traditional parsing
                const modelsToTry = ['gpt-5.1', 'gpt-5', 'gpt-4o', 'gpt-4-turbo'];
                let lastError: any = null;
                let response: any = null;

                for (const model of modelsToTry) {
                    try {
                        console.log(`[Product Purpose] Trying model: ${model}`);
                        response = await this.openaiClient!.chat.completions.create({
                            model: model,
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are an expert software architect who understands how product goals and user needs shape architecture decisions.'
                                },
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                            max_completion_tokens: 8000
                        });
                        console.log(`✅ [Product Purpose] Successfully used model: ${model}`);
                        break;
                    } catch (modelError: any) {
                        console.log(`❌ [Product Purpose] Model ${model} failed:`, modelError.message);
                        lastError = modelError;
                    }
                }

                if (!response || !response.choices?.[0]?.message?.content) {
                    throw new Error(`Product purpose analysis failed: ${lastError?.message || 'Unknown error'}`);
                }

                const content = response.choices[0].message.content;
                return this.parseProductPurposeAnalysis(content);
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
        const isClaude = this.provider === 'claude';
        
        if (isClaude && !this.claudeClient) {
            throw new Error('Claude API key not configured');
        }
        if (!isClaude && !this.openaiClient) {
            throw new Error('OpenAI API key not configured');
        }

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
        const basePrompt = this.buildArchitecturePrompt(context, codeAnalysis, productDocs, productPurposeAnalysis, fileAccessHelper);
        const providerName = isClaude ? 'Claude' : 'OpenAI';
        console.log(`[Architecture Insights] Using ${providerName} provider`);
        console.log('Architecture prompt length:', basePrompt.length);

        try {
            let insights: LLMInsights | null = null;
            const messages: any[] = [];
            let iteration = 0;
            const maxIterations = 3;
            let finalResult: any = null;
            
            while (iteration < maxIterations) {
                iteration++;
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

                if (isClaude) {
                    // Use Claude with structured outputs - NO PARSING NEEDED!
                    console.log('[Architecture Insights] Using Claude with structured outputs...');
                    // Structured outputs is a beta feature
                    const response = await (this.claudeClient as any).beta.messages.create({
                        model: 'claude-sonnet-4-5',
                        max_tokens: 40000,
                        betas: ['structured-outputs-2025-11-13'],
                        system: 'You are an expert software architect who provides clear, actionable insights about code architecture.',
                        messages: messages,
                        output_format: {
                            type: 'json_schema',
                            schema: llmInsightsSchema
                        }
                    });

                    // Claude structured outputs return valid JSON directly - no parsing needed!
                    const textContent = response.content[0].text;
                    if (!textContent) {
                        throw new Error('No text content in Claude response');
                    }
                    finalResult = JSON.parse(textContent);
                    insights = finalResult as LLMInsights;
                    
                    console.log('✅ Claude structured output received (no parsing needed):', {
                        hasOverall: !!insights.overallAssessment,
                        strengthsCount: insights.strengths.length,
                        issuesCount: insights.issues.length
                    });
                } else {
                // Use OpenAI with traditional parsing
                const modelsToTry = ['gpt-5.1', 'gpt-5', 'gpt-4o', 'gpt-4-turbo'];
                let lastError: any = null;
                let response: any = null;

                    for (const model of modelsToTry) {
                        try {
                            console.log(`Trying model: ${model}`);
                            response = await this.openaiClient!.chat.completions.create({
                                model: model,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an expert software architect who provides clear, actionable insights about code architecture.'
                                    },
                                    ...messages
                                ],
                                max_completion_tokens: 40000
                            });
                            console.log(`✅ Successfully used model: ${model}`);
                            break;
                        } catch (modelError: any) {
                            console.log(`❌ Model ${model} failed:`, modelError.message);
                            lastError = modelError;
                        }
                    }

                    if (!response) {
                        const errorDetails = lastError?.response?.data 
                            ? JSON.stringify(lastError.response.data, null, 2)
                            : lastError?.message || 'Unknown error';
                        throw new Error(`All models failed. Last error: ${errorDetails}`);
                    }

                    const firstChoice = response.choices?.[0];
                    const content = firstChoice.message.content || '';
                    
                    if (firstChoice.finish_reason === 'length') {
                        console.warn('⚠️ Response was truncated due to token limit.');
                    }
                    
                    if (!content || content.length === 0) {
                        throw new Error(`LLM API returned empty response. Finish reason: ${firstChoice.finish_reason}`);
                    }

                    // Parse OpenAI response (traditional approach)
                    insights = this.parseArchitectureInsights(content, context);
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
                    insights.rawContent = content;
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

                // Limit to 5 requests per iteration
                const limitedRequests = requests.slice(0, 5);
                console.log(`[Architecture Insights] Processing ${limitedRequests.length} request(s) in iteration ${iteration}`);

                // Process requests
                let additionalInfo = '\n## Additional Information Requested\n\n';
                const fileRequests = limitedRequests.filter(r => r.type === 'file') as any[];
                const grepRequests = limitedRequests.filter(r => r.type === 'grep') as any[];

                // Read requested files
                if (fileRequests.length > 0) {
                    const filePaths = fileRequests.map(r => r.path);
                    const fileResponses = fileAccessHelper.readFiles(filePaths);
                    additionalInfo += fileAccessHelper.formatFileResponses(fileResponses);
                }

                // Execute grep searches
                if (grepRequests.length > 0) {
                    const grepResponses = grepRequests.map(req => 
                        fileAccessHelper.grep(req.pattern, req.filePattern, req.maxResults || 20)
                    );
                    additionalInfo += fileAccessHelper.formatGrepResponses(grepResponses);
                }

                // Add assistant response and additional info to conversation
                messages.push({
                    role: 'assistant',
                    content: JSON.stringify(finalResult)
                });
                messages.push({
                    role: 'user',
                    content: additionalInfo
                });
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

    private buildProductDocsPrompt(context: AnalysisContext): string {
        return `Analyze this codebase and generate comprehensive product documentation.

## Codebase Statistics
- Total Files: ${context.totalFiles}
- Total Lines: ${context.totalLines}
- Languages: ${this.getLanguages(context.files)}

## Entry Points
${context.entryPoints.map(ep => `- ${ep.path} (${ep.type}): ${ep.reason}`).join('\n')}

## File Structure
${this.formatFilesByDirectory(context.files)}

## Your Task

Generate product documentation in MARKDOWN format (NOT HTML) using EXACTLY these markdown section headers. The content will be rendered in VSCode, so use proper markdown syntax:

## Overview
[Write a comprehensive overview here - at least 3-4 sentences]

## Key Features
- Feature 1
- Feature 2
- Feature 3
[Continue with more features]

## Architecture
[Describe the architecture here - at least 2-3 paragraphs]

## Tech Stack
- Technology 1
- Technology 2
[Continue with more technologies]

## API Endpoints
[If applicable, list endpoints here]

## Data Models
[If applicable, describe data models here]

## User Flows
[If applicable, describe user flows here]

IMPORTANT: 
- Use MARKDOWN format (NOT HTML) - the content will be rendered in VSCode
- Use the EXACT section headers shown above (## Overview, ## Key Features, etc.)
- Start each section immediately after the header
- Do NOT include HTML tags like <div>, <p>, <br>, etc. - use markdown syntax instead`;
    }

    private buildProductPurposePrompt(
        productDocs: EnhancedProductDocumentation,
        context: AnalysisContext
    ): string {
        return `Analyze this product's purpose and understand WHY its architecture exists.

## Product Overview
${productDocs.overview}

## What It Does
${productDocs.whatItDoes.map(f => `- ${f}`).join('\n')}

## Architecture Summary
${productDocs.architecture}

## User Interfaces
${productDocs.userPerspective.gui ? `GUI: ${productDocs.userPerspective.gui.join(', ')}` : ''}
${productDocs.userPerspective.cli ? `CLI: ${productDocs.userPerspective.cli.join(', ')}` : ''}
${productDocs.userPerspective.api ? `API: ${productDocs.userPerspective.api.join(', ')}` : ''}

## Problems Solved
${productDocs.problemsSolved.map(p => `- ${p}`).join('\n')}

## Entry Points
${context.entryPoints.map(ep => `- ${ep.path} (${ep.type}): ${ep.reason}`).join('\n')}

## Your Task

Analyze WHY this architecture exists based on the product's purpose. Provide your analysis in MARKDOWN format (NOT HTML) using EXACTLY these markdown section headers. The content will be rendered in VSCode:

## Product Purpose
[What is this product trying to achieve? What is its core mission?]

## Architecture Rationale
[Why does this architecture exist? For example:
- If there are multiple entry points, WHY? (e.g., "The product serves multiple user types: GUI users, CLI users, and API consumers, each needing their own entry point")
- If there are multiple interfaces, WHY? (e.g., "The product needs to be accessible via desktop GUI, command line, and web API to serve different user workflows")
- What product goals drove these architectural decisions?]

## Key Design Decisions
- Decision 1: [What decision] - Reason: [Why this decision was made based on product needs]
- Decision 2: [What decision] - Reason: [Why this decision was made]
[Continue with more decisions]

## User Goals
- Goal 1: [What users are trying to accomplish]
- Goal 2: [What users are trying to accomplish]
[Continue with more user goals]

## Contextual Factors
- Factor 1: [What factors influence the architecture? e.g., "Multi-interface support", "Extensibility requirements", "Real-time streaming needs"]
- Factor 2: [Another factor]
[Continue with more factors]

IMPORTANT: Focus on understanding WHY the architecture exists, not just what it is. Connect architectural decisions to product goals and user needs.`;
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

    private buildArchitecturePrompt(
        context: AnalysisContext,
        codeAnalysis?: CodeAnalysis,
        productDocs?: EnhancedProductDocumentation,
        productPurposeAnalysis?: ProductPurposeAnalysis,
        fileAccessHelper?: FileAccessHelper
    ): string {
        const fileOrgAnalysis = this.analyzeFileOrganization(context.files);
        
        let prompt = `Analyze this codebase architecture and provide insights.

## Statistics
- Total Files: ${context.totalFiles}
- Total Lines: ${context.totalLines}
- Total Functions: ${context.totalFunctions}
- Large Files (>500 LOC): ${context.largeFiles}

## File Organization Analysis
${fileOrgAnalysis}

## Dependency Analysis
- Files Imported by Others: ${context.importedFiles.length}
- Orphaned Files (Not Imported): ${context.orphanedFiles.length}
- Files with Imports: ${Object.keys(context.imports).length}

## Entry Points
${context.entryPoints.map(ep => `- ${ep.path} (${ep.type}): ${ep.reason}`).join('\n')}

## Import Graph Sample
${this.formatImportGraph(context.imports)}

## Largest Files
${context.files
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10)
    .map((f, i) => `${i + 1}. ${f.path} - ${f.lines} lines, ${f.functions} functions`)
    .join('\n')}

## Orphaned Files Sample
${context.orphanedFiles.slice(0, 15).map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Current File Structure
${this.formatFilesByDirectory(context.files)}

${fileAccessHelper ? fileAccessHelper.getFileListing(context.files) : ''}

**IMPORTANT: Iterative Analysis Available**
If you need to examine specific files or search for code patterns to provide better analysis, you can use the optional \`requests\` field in your response:
- Request files: \`{ "type": "file", "path": "src/main.ts", "reason": "Need to see main entry point" }\`
- Request grep search: \`{ "type": "grep", "pattern": "class.*Controller", "filePattern": "*.ts", "maxResults": 10, "reason": "Looking for controllers" }\`

You can make up to 5 requests per iteration. If you request files/grep searches, the system will provide the results and you can continue analyzing. Maximum 3 iterations total.

# Your Task

Provide a comprehensive architectural analysis in MARKDOWN format (NOT HTML) using EXACTLY these markdown section headers. The content will be rendered in VSCode, so use proper markdown syntax:

## Overall Architecture Assessment
[Describe the architecture style/pattern here - at least 2-3 paragraphs]

## Strengths
- Strength 1
- Strength 2
[Continue with more strengths]

## Issues & Concerns
CRITICAL: For EACH issue, provide a structured response with:
1. **Title**: Human-readable title (e.g., "Root Directory Clutter" not "Multiple files in root")
2. **Description**: Detailed description including problem AND proposed fix
3. **Relevant Files**: List of file paths affected (e.g., ["src/main.ts", "package.json"])
4. **Relevant Functions**: List of function/class names involved (e.g., ["initializeApp", "UserService"])

Format for description:
[Problem description]. **Proposed Fix**: [Specific, actionable solution with steps or approach. Be detailed and concrete.]

Examples:
- Title: "Root Directory Clutter"
  Description: "165 files in root directory (including ~124 .md files and multiple .sh scripts) make navigation difficult. **Proposed Fix**: Create organized folder structure: move documentation to docs/, config files to config/, utilities to utils/. Create a migration script that: (1) moves files, (2) updates imports, (3) verifies entry points work."
  Relevant Files: ["README.md", "package.json", "setup.sh", "build.sh"]
  Relevant Functions: []

- Title: "Tight Coupling Between Modules"
  Description: "Components are directly dependent on concrete implementations, making testing and maintenance difficult. **Proposed Fix**: Introduce dependency injection and interfaces. Create abstraction layers between modules. Start by identifying the most tightly coupled modules and create interfaces for their dependencies."
  Relevant Files: ["src/services/UserService.ts", "src/services/OrderService.ts"]
  Relevant Functions: ["UserService.getUser", "OrderService.createOrder"]

IMPORTANT: Every issue MUST have a clear, human-readable title and a detailed description with proposed fix. Include relevant files and functions when applicable.

[Continue with more issues, each with title, description, relevantFiles, and relevantFunctions]

## Code Organization
CRITICALLY analyze file structure. Pay special attention to:
- Files cluttering the root directory (e.g., many .md files, config files, etc.)
- Missing logical folder structure
- Files that should be organized into subdirectories
- Documentation files that should be in a docs/ folder
- Configuration files that should be organized
- Any file organization anti-patterns

[Write your analysis here - at least 2-3 paragraphs]

## Entry Points
[Analyze entry points here]

## Orphaned Files
[What these orphaned files might represent]

## Folder Reorganization
Provide SPECIFIC, DETAILED folder reorganization suggestions. For each suggestion:
- List specific files that should be moved
- Specify the target directory structure
- Explain the rationale
- If there are many files in root (like 80 .md files), provide a clear plan to organize them

[Write your detailed reorganization plan here]

## Recommendations
CRITICAL: Make recommendations CONTEXTUAL based on product goals. Use conditional format:
- **If you want [product goal X]**: [Then refactor this way] - [Rationale]
- **If you want [product goal Y]**: [Then consider these changes] - [Rationale]
- **If you want to maintain [current behavior]**: [Then keep this architecture] - [Rationale]

Examples:
- **If you want to maintain multi-interface support (GUI, CLI, API)**: Keep the multiple entry points architecture. The current structure supports different user workflows effectively. Consider organizing entry points into a dedicated entry/ directory for clarity.
- **If you want to simplify to a single interface**: Consolidate to one primary entry point and deprecate others. This reduces complexity but limits user access patterns.
- **If you want to improve extensibility**: Introduce a plugin system and abstract the core engine further. This aligns with the product's extensibility goals.

[Continue with more contextual recommendations]

## Refactoring Priorities
For EACH priority, provide:
1. **Title**: Human-readable title (e.g., "Organize Documentation Files" not "Move .md files")
2. **Description**: Detailed description with rationale
3. **Relevant Files**: List of file paths affected
4. **Relevant Functions**: List of function/class names involved

Examples:
- Title: "Organize Documentation Files"
  Description: "Move 124 .md files from root to docs/ directory. This will significantly improve navigation and make the project structure clearer. High impact, low risk."
  Relevant Files: ["README.md", "CONTRIBUTING.md", "CHANGELOG.md", "... (124 files)"]
  Relevant Functions: []

[Continue with top 3-5 priorities, each with title, description, relevantFiles, and relevantFunctions]

IMPORTANT: 
- Use MARKDOWN format (NOT HTML) - the content will be rendered in VSCode
- Use the EXACT section headers shown above (## Overall Architecture Assessment, ## Strengths, etc.)
- Start each section immediately after the header
- Be specific and actionable
- Focus on file organization issues, especially root directory clutter
- Do NOT include HTML tags like <div>, <p>, <br>, etc. - use markdown syntax instead`;

        // Add product purpose analysis if available (this is the KEY addition)
        if (productPurposeAnalysis) {
            prompt += `\n\n## Product Purpose & Architecture Rationale\n\n`;
            prompt += `**Product Purpose:** ${productPurposeAnalysis.productPurpose}\n\n`;
            prompt += `**Architecture Rationale:** ${productPurposeAnalysis.architectureRationale}\n\n`;
            if (productPurposeAnalysis.designDecisions.length > 0) {
                prompt += `**Key Design Decisions:**\n${productPurposeAnalysis.designDecisions.map(d => `- ${d}`).join('\n')}\n\n`;
            }
            if (productPurposeAnalysis.userGoals.length > 0) {
                prompt += `**User Goals:**\n${productPurposeAnalysis.userGoals.map(g => `- ${g}`).join('\n')}\n\n`;
            }
            if (productPurposeAnalysis.contextualFactors.length > 0) {
                prompt += `**Contextual Factors:**\n${productPurposeAnalysis.contextualFactors.map(f => `- ${f}`).join('\n')}\n\n`;
            }
            prompt += `\n**CRITICAL INSTRUCTION:** Use this product purpose analysis to understand WHY the architecture exists. `;
            prompt += `When making recommendations, consider whether they align with the product's goals. `;
            prompt += `For example, if the product needs multiple entry points to serve different user types, `;
            prompt += `don't recommend consolidating them unless that aligns with a new product goal. `;
            prompt += `Make recommendations conditional: "If you want X, then Y" based on product goals.\n\n`;
        }

        // Add product documentation context if available (for additional details)
        if (productDocs) {
            prompt += `\n## Additional Product Context\n\n`;
            if (productDocs.overview) {
                prompt += `**Product Overview:**\n${productDocs.overview}\n\n`;
            }
            if (productDocs.modules && productDocs.modules.length > 0) {
                prompt += `**Modules:**\n${productDocs.modules.map(m => `- ${m.module} (${m.moduleType}): ${m.summary || 'No summary'}`).join('\n')}\n\n`;
            }
        }

        // Add detailed code analysis if available
        if (codeAnalysis) {
            prompt += `\n\n## Detailed Code Analysis\n\n`;
            if (codeAnalysis.functions && codeAnalysis.functions.length > 0) {
                prompt += `**Functions:** ${codeAnalysis.functions.length} total functions found\n`;
                // Show function distribution by file
                const funcsByFile = new Map<string, number>();
                for (const func of codeAnalysis.functions) {
                    funcsByFile.set(func.file, (funcsByFile.get(func.file) || 0) + 1);
                }
                const topFiles = Array.from(funcsByFile.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);
                prompt += `Top files by function count:\n${topFiles.map(([file, count]) => `- ${file}: ${count} functions`).join('\n')}\n\n`;
            }
        }

        return prompt;
    }

    private analyzeFileOrganization(files: Array<{ path: string; lines: number }>): string {
        const rootFiles: string[] = [];
        const byExtension: { [ext: string]: number } = {};
        const byDirectory: { [dir: string]: number } = {};
        
        for (const file of files) {
            const parts = file.path.split('/');
            const isRoot = parts.length === 1;
            const ext = parts[parts.length - 1].split('.').pop() || '';
            const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
            
            if (isRoot) {
                rootFiles.push(file.path);
            }
            
            byExtension[ext] = (byExtension[ext] || 0) + 1;
            byDirectory[dir] = (byDirectory[dir] || 0) + 1;
        }
        
        let analysis = `- Files in Root Directory: ${rootFiles.length}\n`;
        
        if (rootFiles.length > 20) {
            analysis += `⚠️ WARNING: ${rootFiles.length} files in root directory - this is excessive!\n`;
            analysis += `Root files: ${rootFiles.slice(0, 20).join(', ')}${rootFiles.length > 20 ? ` ... and ${rootFiles.length - 20} more` : ''}\n`;
        }
        
        // Find extensions with many files in root
        const rootByExt: { [ext: string]: number } = {};
        for (const file of rootFiles) {
            const ext = file.split('.').pop() || '';
            rootByExt[ext] = (rootByExt[ext] || 0) + 1;
        }
        
        const problematicExts = Object.entries(rootByExt)
            .filter(([ext, count]) => count > 10)
            .sort((a, b) => b[1] - a[1]);
        
        if (problematicExts.length > 0) {
            analysis += `\n⚠️ Root Directory Clutter by Extension:\n`;
            for (const [ext, count] of problematicExts) {
                analysis += `  - ${ext.toUpperCase()} files in root: ${count}\n`;
            }
        }
        
        analysis += `\n- Top Directories by File Count:\n`;
        const topDirs = Object.entries(byDirectory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        for (const [dir, count] of topDirs) {
            analysis += `  - ${dir}/: ${count} files\n`;
        }
        
        return analysis;
    }

    private formatImportGraph(imports: { [key: string]: string[] }): string {
        const entries = Object.entries(imports).slice(0, 10);
        return entries.map(([file, deps]) => {
            const depList = deps.slice(0, 5).map(d => `  → ${d}`).join('\n');
            const more = deps.length > 5 ? `\n  ... and ${deps.length - 5} more` : '';
            return `${file} imports:\n${depList}${more}`;
        }).join('\n\n');
    }

    private formatFilesByDirectory(files: Array<{ path: string; lines: number }>): string {
        const dirs: { [key: string]: number } = {};
        
        for (const file of files) {
            const parts = file.path.split('/');
            const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
            dirs[dir] = (dirs[dir] || 0) + 1;
        }

        return Object.entries(dirs)
            .sort()
            .slice(0, 30)
            .map(([dir, count]) => `${dir}/ (${count} files)`)
            .join('\n');
    }

    private getLanguages(files: Array<{ language: string }>): string {
        const langs = new Set(files.map(f => f.language));
        return Array.from(langs).join(', ');
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
- Use \`git mv\` to preserve git history
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

    // ========== Enhanced Documentation Prompt Builders ==========

    private buildFileAnalysisPrompt(file: FileInfo, content: string, role: string): string {
        const contentPreview = content.length > 2000 ? content.substring(0, 2000) + '...' : content;
        
        return `Analyze this code file and extract structured information.

File: ${file.path}
Role: ${role}
Lines: ${file.lines}
Language: ${file.language}

File Content:
\`\`\`
${contentPreview}
\`\`\`

Extract the following information in JSON format (NOT HTML). The content will be used programmatically in VSCode:

{
  "purpose": "What this file does in one sentence",
  "userVisibleActions": ["Action 1 user sees", "Action 2 user sees"],
  "developerVisibleActions": ["What developer does", "What happens in background"],
  "keyFunctions": [
    {"name": "function_name", "desc": "What it does", "inputs": "parameters", "outputs": "return value"}
  ],
  "dependencies": ["module1", "module2"],
  "intent": "Why does this file exist? What problem does it solve?"
}

IMPORTANT:
- Respond in JSON format (NOT HTML) - the content will be used programmatically in VSCode
- Focus on USER-FACING behavior (what the user sees/experiences)
- Focus on DEVELOPER-FACING behavior (what the developer does/triggers)
- Do NOT describe implementation details
- Do NOT include HTML tags - use plain JSON strings
- Answer: "When the user does X, what happens?"
- Answer: "What does the developer see/use?"`;
    }

    private buildModuleRollupPrompt(modulePath: string, moduleType: string, files: FileSummary[]): string {
        const filesSummary = files.map(f => 
            `- ${f.file} (${f.role}): ${f.purpose}\n  User actions: ${f.userVisibleActions.join(', ')}`
        ).join('\n');

        return `Create a module-level summary for this module.

Module: ${modulePath}
Type: ${moduleType}
Files (${files.length}):
${filesSummary}

Generate a summary that:
1. Describes the module's CAPABILITIES from a user perspective
2. Lists what users can DO with this module
3. Describes workflows/flows
4. If API module: list endpoints with descriptions
5. If CLI module: list commands with descriptions
6. If Worker module: describe job flows

Use this JSON format (NOT HTML). The content will be used programmatically in VSCode:
{
  "capabilities": ["Capability 1", "Capability 2"],
  "summary": "2-3 paragraph summary of what this module does",
  "endpoints": [{"path": "/api/endpoint", "method": "POST", "description": "What it does"}],
  "commands": [{"command": "cmd-name", "description": "What it does"}],
  "workers": [{"name": "WorkerName", "description": "What it does", "jobFlow": "How jobs flow"}]
}

IMPORTANT:
- Respond in JSON format (NOT HTML) - the content will be used programmatically in VSCode
- Do NOT include HTML tags - use plain JSON strings
- Focus on USER-FACING capabilities, not implementation.`;
    }

    private buildProductLevelPrompt(
        fileSummaries: FileSummary[],
        moduleSummaries: ModuleSummary[],
        analysis: CodeAnalysis,
        fileAccessHelper: FileAccessHelper
    ): string {
        const modulesSummary = moduleSummaries.map(m => 
            `- ${m.module} (${m.moduleType}): ${m.summary}\n  Capabilities: ${m.capabilities.join(', ')}`
        ).join('\n');

        return `Create comprehensive product documentation from this codebase analysis. Your goal is to describe what this SPECIFIC application does for users, not how it's built.

Codebase Stats:
- Total Files: ${analysis.totalFiles}
- Total Lines: ${analysis.totalLines}
- Entry Points: ${analysis.entryPoints.length}

Modules (${moduleSummaries.length}):
${modulesSummary}

Key Files Analyzed:
${fileSummaries.slice(0, 50).map(f => `- ${f.file} (${f.role}): ${f.purpose}`).join('\n')}
${fileSummaries.length > 50 ? `\n... and ${fileSummaries.length - 50} more files` : ''}

${fileAccessHelper.getFileListing(analysis.files)}

**IMPORTANT: Iterative Analysis Available**
If you need to examine specific files or search for code patterns to provide better analysis, you can use the optional \`requests\` field in your response:
- Request files: \`{ "type": "file", "path": "src/main.ts", "reason": "Need to see main entry point" }\`
- Request grep search: \`{ "type": "grep", "pattern": "class.*Controller", "filePattern": "*.ts", "maxResults": 10, "reason": "Looking for controllers" }\`

You can make up to 5 requests per iteration. If you request files/grep searches, the system will provide the results and you can continue analyzing. Maximum 3 iterations total.

You MUST respond with valid JSON (NOT HTML, NOT Markdown code blocks) matching the required schema. The content will be used programmatically in VSCode. Include these fields:

1. **overview**: 2-3 paragraphs describing what THIS SPECIFIC application is from a user perspective
2. **whatItDoes**: Array of specific user-facing features and capabilities
3. **userPerspective**: Object with gui, cli, api, cicd arrays describing user interactions
4. **workflowIntegration**: Array of specific workflows this application supports
5. **problemsSolved**: Array of specific problems this application solves
6. **architecture**: 2-3 paragraphs describing architecture (high-level components, no file paths)
7. **titles**: Array of key titles/names of features, modules, components, major functionality
8. **descriptions**: Array of objects with title, description, and optional category (feature/module/component/workflow/integration/other)
9. **relevantFunctions**: Array of objects with name, description, and optional file/module - important functions, methods, procedures
10. **relevantDataStructures**: Array of objects with name, description, optional type (class/interface/type/model/schema/struct/other), and optional file
11. **relevantCodeFiles**: Array of objects with path, description, purpose, and optional role - important code files
12. **exampleInput**: Object with optional description and json - Example input JSON showing actual data that might flow through the system (e.g., API request body, file upload format, user input format)
13. **exampleOutput**: Object with optional description and json - Example output JSON showing actual data that the system might produce (e.g., API response, processed data format, result format)

CRITICAL RULES - FOLLOW THESE STRICTLY:
1. NEVER mention file paths, folder structures, or technical file locations in descriptions (e.g., "apps/api/static/js", "JavaScript assets")
2. NEVER describe HOW the code is organized - describe WHAT the application does
3. Be SPECIFIC to THIS application - avoid generic descriptions that could apply to any app
4. Focus on USER FUNCTIONALITY: What can users DO? What do they SEE? What problems does it solve?
5. Describe actual features and workflows, not technical implementation details
6. For relevantCodeFiles: Include the file path, but describe its purpose from a user/functionality perspective, not technical details
7. For relevantFunctions: Focus on functions that are important to understanding what the app does, not internal utilities
8. For relevantDataStructures: Focus on data structures that represent important domain concepts or user-facing data
9. For exampleInput: Provide realistic example JSON showing what input data looks like when users/clients interact with the system (API requests, file formats, configuration, etc.)
10. For exampleOutput: Provide realistic example JSON showing what output data looks like (API responses, processed results, reports, etc.)
11. Answer: "What does THIS specific application do for its users?"
12. Answer: "What specific problems does THIS application solve?"
13. Answer: "What specific workflows does THIS application support?"

BAD EXAMPLE (DO NOT DO THIS):
"Interactive elements (buttons, inputs, status indicators) powered by JavaScript assets from apps/api/static/js"

GOOD EXAMPLE (DO THIS):
"Users can upload files through a web interface, view real-time processing status, and download completed results. The interface shows progress indicators and allows users to cancel operations in progress."`;
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
        const isClaude = this.provider === 'claude';
        
        if (isClaude && !this.claudeClient) {
            throw new Error('Claude API key not configured');
        }
        if (!isClaude && !this.openaiClient) {
            throw new Error('OpenAI API key not configured');
        }

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

            if (isClaude) {
                // Use Claude with structured outputs - NO PARSING NEEDED!
                console.log('[Unit Test Plan] Using Claude with structured outputs...');
                const response = await (this.claudeClient as any).beta.messages.create({
                    model: 'claude-sonnet-4-5',
                    max_tokens: 40000,
                    betas: ['structured-outputs-2025-11-13'],
                    system: 'You are an expert test architect who creates comprehensive unit test plans.',
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    output_format: {
                        type: 'json_schema',
                        schema: unitTestPlanSchema
                    }
                });

                // Claude structured outputs return valid JSON directly - no parsing needed!
                const textContent = response.content[0].text;
                if (!textContent) {
                    throw new Error('No text content in Claude response');
                }
                result = JSON.parse(textContent);
                
                console.log('✅ [Unit Test Plan] Claude structured output received (no parsing needed):', {
                    hasStrategy: !!result.unit_test_strategy,
                    testSuitesCount: result.test_suites?.length || 0
                });
            } else {
                // Use OpenAI with model fallback pattern (same as generateArchitectureInsights)
                const modelsToTry = ['gpt-5.1', 'gpt-5', 'gpt-4o', 'gpt-4-turbo'];
                let lastError: any = null;
                let response: any = null;

                for (const model of modelsToTry) {
                    // Check for cancellation
                    if (cancellationToken?.isCancellationRequested) {
                        throw new Error('Cancelled by user');
                    }

                    try {
                        console.log(`[Unit Test Plan] Trying model: ${model}`);
                        response = await this.openaiClient!.chat.completions.create({
                            model: model,
                            messages: [{
                                role: 'system',
                                content: 'You are an expert test architect who creates comprehensive unit test plans. Return ONLY valid JSON, no other text.'
                            }, {
                                role: 'user',
                                content: prompt
                            }],
                            temperature: 0.3,
                            max_completion_tokens: 40000
                        });
                        console.log(`✅ [Unit Test Plan] Successfully used model: ${model}`);
                        break;
                    } catch (modelError: any) {
                        console.log(`❌ [Unit Test Plan] Model ${model} failed:`, modelError.message);
                        lastError = modelError;
                    }
                }

                if (!response) {
                    const errorDetails = lastError?.response?.data 
                        ? JSON.stringify(lastError.response.data, null, 2)
                        : lastError?.message || 'Unknown error';
                    throw new Error(`All models failed. Last error: ${errorDetails}`);
                }

                const firstChoice = response.choices?.[0];
                const content = firstChoice?.message?.content || '';
                
                if (firstChoice?.finish_reason === 'length') {
                    console.warn('⚠️ [Unit Test Plan] Response was truncated due to token limit.');
                }
                
                if (!content || content.length === 0) {
                    throw new Error(`LLM API returned empty response. Finish reason: ${firstChoice?.finish_reason}`);
                }

                // Try to parse as JSON
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        result = JSON.parse(jsonMatch[0]);
                    } else {
                        result = { rawContent: content };
                    }
                } catch {
                    result = { rawContent: content };
                }
            }

            SWLogger.log('Unit test plan generated successfully');
            return result;
        } catch (error: any) {
            console.error('Error in generateUnitTestPlan:', error);
            throw new Error(`Failed to generate unit test plan: ${error.message || error}`);
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

10. **Test Quality**: Each test should:
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
        const isClaude = this.provider === 'claude';
        
        if (isClaude && !this.claudeClient) {
            throw new Error('Claude API key not configured');
        }
        if (!isClaude && !this.openaiClient) {
            throw new Error('OpenAI API key not configured');
        }

        const prompt = this.buildComprehensiveReportPrompt(context, codeAnalysis, productDocs, architectureInsights);

        try {
            if (isClaude) {
                const response = await this.claudeClient!.messages.create({
                    model: 'claude-sonnet-4-5',
                    max_tokens: 8192,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                });

                if (cancellationToken?.isCancellationRequested) {
                    throw new Error('Cancelled by user');
                }

                const content = response.content[0];
                if (content.type === 'text') {
                    return content.text;
                } else {
                    throw new Error('Unexpected response type from Claude');
                }
            } else {
                // OpenAI fallback
                const models = ['gpt-4o', 'gpt-4-turbo', 'gpt-4'];
                let lastError: any = null;

                for (const model of models) {
                    try {
                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }

                        const response = await this.openaiClient!.chat.completions.create({
                            model: model,
                            messages: [{ role: 'user', content: prompt }],
                            max_completion_tokens: 8192,
                            temperature: 0.7
                        });

                        if (cancellationToken?.isCancellationRequested) {
                            throw new Error('Cancelled by user');
                        }

                        const content = response.choices[0]?.message?.content;
                        if (content) {
                            return content;
                        }
                    } catch (error: any) {
                        lastError = error;
                        console.warn(`Failed with model ${model}:`, error.message);
                        continue;
                    }
                }

                throw lastError || new Error('All models failed');
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
}

