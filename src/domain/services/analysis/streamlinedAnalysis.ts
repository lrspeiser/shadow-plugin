/**
 * Streamlined Analysis Service
 * 
 * New analysis workflow:
 * 1. Scan project structure (no LLM)
 * 2. For tiny projects: 1 LLM call for everything
 * 3. For small projects: 1 planner call + N file calls + 1 synthesis call
 * 4. For larger projects: Same pattern but batched
 */

import * as fs from 'fs';
import * as path from 'path';
import { SWLogger } from '../../../logger';
import { scanProjectStructure, ProjectSummary } from './analysisPlanner';
import { SimpleExtractorService, SCHEMAS } from './simpleExtractor';

/**
 * Read and parse .shadowignore file
 * Returns array of patterns to ignore (similar to .gitignore)
 */
function loadShadowIgnore(workspaceRoot: string): string[] {
    const ignorePath = path.join(workspaceRoot, '.shadowignore');
    const defaultIgnores = [
        'node_modules',
        '.shadow',
        'dist',
        'out', 
        'build',
        'coverage',
        '__pycache__',
        '.git',
        'UnitTests' // Our generated tests
    ];
    
    if (!fs.existsSync(ignorePath)) {
        return defaultIgnores;
    }
    
    try {
        const content = fs.readFileSync(ignorePath, 'utf-8');
        const customIgnores = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#')); // Skip empty lines and comments
        
        SWLogger.log(`[ShadowIgnore] Loaded ${customIgnores.length} custom ignore patterns`);
        return [...defaultIgnores, ...customIgnores];
    } catch (err) {
        SWLogger.log(`[ShadowIgnore] Could not read .shadowignore: ${err}`);
        return defaultIgnores;
    }
}

/**
 * Check if a path should be ignored based on patterns
 */
function shouldIgnore(filePath: string, ignorePatterns: string[]): boolean {
    for (const pattern of ignorePatterns) {
        // Simple pattern matching - supports folder names and wildcards
        if (pattern.includes('*')) {
            // Convert glob to regex
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            if (regex.test(filePath) || regex.test(path.basename(filePath))) {
                return true;
            }
        } else {
            // Exact folder/file name match
            if (filePath.includes(pattern) || filePath.startsWith(pattern)) {
                return true;
            }
        }
    }
    return false;
}

export interface StreamlinedResult {
    overview: string;
    functions: any[];
    modules: any[];
    strengths: string[];
    issues: string[];
    testTargets: any[];
    stats: {
        totalFiles: number;
        totalLines: number;
        llmCalls: number;
        totalTimeMs: number;
    };
}

/**
 * Get list of code files from project summary, respecting .shadowignore
 */
function getCodeFiles(workspaceRoot: string, summary: ProjectSummary): string[] {
    const files: string[] = [];
    const ignorePatterns = loadShadowIgnore(workspaceRoot);
    const testPatterns = ['.test.', '.spec.', '_test.'];
    const codeExtensions = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs']);

    function walkDir(dir: string, relPath: string = '') {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;

                if (entry.isDirectory()) {
                    // Check against ignore patterns
                    if (!entry.name.startsWith('.') && !shouldIgnore(entryRelPath, ignorePatterns)) {
                        walkDir(fullPath, entryRelPath);
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    const isTestFile = testPatterns.some(p => entry.name.includes(p));
                    const isIgnored = shouldIgnore(entryRelPath, ignorePatterns);
                    
                    if (codeExtensions.has(ext) && !isTestFile && !isIgnored) {
                        files.push(entryRelPath);
                    }
                }
            }
        } catch {
            // Skip unreadable directories
        }
    }

    walkDir(workspaceRoot);
    return files;
}

export class StreamlinedAnalysisService {
    /**
     * Run streamlined analysis on a workspace
     */
    static async analyze(
        workspaceRoot: string,
        llmService: any,
        onProgress?: (message: string, llmCallNumber: number) => void
    ): Promise<StreamlinedResult> {
        const startTime = Date.now();
        let llmCallCount = 0;

        // Step 1: Scan project structure (no LLM)
        SWLogger.section('Streamlined Analysis');
        SWLogger.log('[Step 1] Scanning project structure...');
        onProgress?.('Scanning project structure...', 0);
        
        const summary = scanProjectStructure(workspaceRoot);
        const codeFiles = getCodeFiles(workspaceRoot, summary);
        
        SWLogger.log(`[Step 1] Found ${codeFiles.length} code files`);
        SWLogger.log(`[Step 1] Files: ${codeFiles.slice(0, 10).join(', ')}${codeFiles.length > 10 ? '...' : ''}`);

        // Determine project size and strategy
        const projectSize = codeFiles.length <= 5 ? 'tiny' : 
                          codeFiles.length <= 20 ? 'small' : 
                          codeFiles.length <= 100 ? 'medium' : 'large';

        SWLogger.log(`[Step 1] Project size: ${projectSize} (${codeFiles.length} files)`);

        let result: StreamlinedResult;

        if (projectSize === 'tiny') {
            // TINY PROJECT: Single LLM call
            result = await this.analyzeTinyProject(workspaceRoot, codeFiles, llmService, onProgress);
            llmCallCount = 1;
        } else if (projectSize === 'small') {
            // SMALL PROJECT: File-by-file then synthesis
            result = await this.analyzeSmallProject(workspaceRoot, codeFiles, llmService, onProgress);
            llmCallCount = codeFiles.length + 1; // files + synthesis
        } else {
            // MEDIUM/LARGE: Sample key files
            result = await this.analyzeLargeProject(workspaceRoot, codeFiles, summary, llmService, onProgress);
            llmCallCount = Math.min(15, Math.ceil(codeFiles.length / 5)) + 1;
        }

        result.stats = {
            totalFiles: codeFiles.length,
            totalLines: summary.totalLines,
            llmCalls: llmCallCount,
            totalTimeMs: Date.now() - startTime
        };

        SWLogger.section('Analysis Complete');
        SWLogger.log(`Total time: ${result.stats.totalTimeMs}ms`);
        SWLogger.log(`LLM calls: ${result.stats.llmCalls}`);

        return result;
    }

    /**
     * Analyze tiny project in single LLM call
     */
    private static async analyzeTinyProject(
        workspaceRoot: string,
        files: string[],
        llmService: any,
        onProgress?: (message: string, llmCallNumber: number) => void
    ): Promise<StreamlinedResult> {
        SWLogger.log('[Tiny] Single comprehensive LLM call');
        onProgress?.('Analyzing all files...', 1);

        const extractResult = await SimpleExtractorService.analyzeTinyProject(
            workspaceRoot,
            files,
            llmService
        );

        const data = extractResult.data;
        
        return {
            overview: data.overview || '',
            functions: data.functions || [],
            modules: [], // Tiny projects don't need module grouping
            strengths: data.strengths || [],
            issues: data.issues || [],
            testTargets: data.testTargets || [],
            stats: { totalFiles: 0, totalLines: 0, llmCalls: 0, totalTimeMs: 0 }
        };
    }

    /**
     * Analyze small project file-by-file then synthesize
     */
    private static async analyzeSmallProject(
        workspaceRoot: string,
        files: string[],
        llmService: any,
        onProgress?: (message: string, llmCallNumber: number) => void
    ): Promise<StreamlinedResult> {
        SWLogger.log(`[Small] Analyzing ${files.length} files + synthesis`);
        
        const fileSummaries: { path: string; purpose: string; functions: any[] }[] = [];
        let successCount = 0;
        let errorCount = 0;
        
        // Analyze each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            onProgress?.(`Analyzing ${file}... (${i + 1}/${files.length})`, i + 1);
            
            try {
                const result = await SimpleExtractorService.analyzeFile(
                    workspaceRoot,
                    file,
                    llmService
                );
                
                const funcCount = result.data.functions?.length || 0;
                SWLogger.log(`[Small] ✓ ${file}: ${funcCount} functions found`);
                
                fileSummaries.push({
                    path: file,
                    purpose: result.data.purpose || '',
                    functions: result.data.functions || []
                });
                successCount++;
            } catch (error: any) {
                errorCount++;
                SWLogger.log(`[Small] ✗ Error analyzing ${file}: ${error.message || error}`);
            }
        }
        
        SWLogger.log(`[Small] File analysis complete: ${successCount} succeeded, ${errorCount} failed`);
        
        if (fileSummaries.length === 0) {
            SWLogger.log('[Small] WARNING: No files were successfully analyzed!');
            return {
                overview: 'Analysis failed - no files could be processed',
                functions: [],
                modules: [],
                strengths: [],
                issues: ['Analysis failed to process any files. Check the Shadow Watch output log for details.'],
                testTargets: [],
                stats: { totalFiles: 0, totalLines: 0, llmCalls: 0, totalTimeMs: 0 }
            };
        }

        // Synthesize architecture
        onProgress?.('Synthesizing architecture...', files.length + 1);
        SWLogger.log(`[Small] Synthesizing from ${fileSummaries.length} file summaries...`);
        
        const archResult = await SimpleExtractorService.synthesizeArchitecture(
            fileSummaries,
            llmService
        );

        const archData = archResult.data;
        SWLogger.log(`[Small] Synthesis complete: ${archData.modules?.length || 0} modules, ${archData.testPriorities?.length || 0} test targets`);

        return {
            overview: archData.overview || '',
            functions: fileSummaries.flatMap(f => f.functions.map(fn => ({ ...fn, file: f.path }))),
            modules: archData.modules || [],
            strengths: archData.strengths || [],
            issues: archData.issues || [],
            testTargets: archData.testPriorities || [],
            stats: { totalFiles: 0, totalLines: 0, llmCalls: 0, totalTimeMs: 0 }
        };
    }

    /**
     * Analyze large project by sampling key files
     */
    private static async analyzeLargeProject(
        workspaceRoot: string,
        files: string[],
        summary: ProjectSummary,
        llmService: any,
        onProgress?: (message: string, llmCallNumber: number) => void
    ): Promise<StreamlinedResult> {
        SWLogger.log(`[Large] Sampling key files from ${files.length} total`);
        
        const keyFiles: string[] = [];
        
        // Priority 1: Entry points (extension.ts, index.ts, main.ts, etc.)
        const entryPatterns = ['extension.ts', 'index.ts', 'main.ts', 'app.ts', 'index.js', 'main.js'];
        for (const file of files) {
            const basename = file.split('/').pop() || '';
            if (entryPatterns.includes(basename) && keyFiles.length < 3) {
                keyFiles.push(file);
                SWLogger.log(`[Large] Added entry point: ${file}`);
            }
        }
        
        // Priority 2: Get diversity - one file from each unique top-level folder
        const foldersSeen = new Set<string>();
        for (const file of files) {
            const parts = file.split('/');
            const topFolder = parts.length > 1 ? parts[0] : '.';
            if (!foldersSeen.has(topFolder) && !keyFiles.includes(file)) {
                foldersSeen.add(topFolder);
                keyFiles.push(file);
                SWLogger.log(`[Large] Added from folder ${topFolder}: ${file}`);
                if (keyFiles.length >= 12) break;
            }
        }
        
        // Priority 3: Fill remaining slots with any other files
        for (const file of files) {
            if (!keyFiles.includes(file) && keyFiles.length < 15) {
                keyFiles.push(file);
            }
        }
        
        SWLogger.log(`[Large] Selected ${keyFiles.length} key files to analyze`);
        
        if (keyFiles.length === 0) {
            SWLogger.log(`[Large] ERROR: No files selected! Files available: ${files.slice(0, 5).join(', ')}...`);
            // Fallback: just take first 15 files
            keyFiles.push(...files.slice(0, 15));
            SWLogger.log(`[Large] Fallback: using first ${keyFiles.length} files`);
        }
        
        // Use same approach as small project
        return this.analyzeSmallProject(workspaceRoot, keyFiles, llmService, onProgress);
    }
}
