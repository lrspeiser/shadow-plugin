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
 * Get list of code files from project summary
 */
function getCodeFiles(workspaceRoot: string, summary: ProjectSummary): string[] {
    const files: string[] = [];
    const skipPatterns = ['.test.', '.spec.', '_test.', 'node_modules', '.shadow'];
    const codeExtensions = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs']);

    function walkDir(dir: string, relPath: string = '') {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;

                if (entry.isDirectory()) {
                    if (!entry.name.startsWith('.') && 
                        !entry.name.includes('node_modules') &&
                        !entry.name.includes('.shadow')) {
                        walkDir(fullPath, entryRelPath);
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    const shouldSkip = skipPatterns.some(p => entry.name.includes(p));
                    
                    if (codeExtensions.has(ext) && !shouldSkip) {
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
        
        // Analyze each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            onProgress?.(`Analyzing ${file}...`, i + 1);
            
            try {
                const result = await SimpleExtractorService.analyzeFile(
                    workspaceRoot,
                    file,
                    llmService
                );
                
                fileSummaries.push({
                    path: file,
                    purpose: result.data.purpose || '',
                    functions: result.data.functions || []
                });
            } catch (error) {
                SWLogger.log(`[Small] Error analyzing ${file}: ${error}`);
            }
        }

        // Synthesize architecture
        onProgress?.('Synthesizing architecture...', files.length + 1);
        const archResult = await SimpleExtractorService.synthesizeArchitecture(
            fileSummaries,
            llmService
        );

        const archData = archResult.data;

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
        
        // Select key files: entry points + largest files + files from each folder
        const keyFiles = new Set<string>();
        
        // Add entry points
        for (const ep of summary.entryPoints.slice(0, 5)) {
            if (files.includes(ep)) keyFiles.add(ep);
        }
        
        // Add files from each major folder (up to 2 per folder)
        for (const folder of summary.folders.slice(0, 10)) {
            const folderFiles = files.filter(f => f.startsWith(folder.path));
            for (const f of folderFiles.slice(0, 2)) {
                keyFiles.add(f);
            }
        }
        
        // Limit to 15 files max
        const filesToAnalyze = Array.from(keyFiles).slice(0, 15);
        SWLogger.log(`[Large] Selected ${filesToAnalyze.length} key files to analyze`);
        
        // Use same approach as small project
        return this.analyzeSmallProject(workspaceRoot, filesToAnalyze, llmService, onProgress);
    }
}
