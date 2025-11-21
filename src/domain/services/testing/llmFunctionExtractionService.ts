/**
 * LLM-based function extraction service
 * Replaces regex-based extraction to avoid capturing control flow keywords
 */

import * as fs from 'fs';
import * as path from 'path';
import { CodeAnalysis } from '../../../analyzer';
import { buildFunctionExtractionPrompt, buildSingleFileExtractionPrompt } from '../../prompts/functionExtractionPrompt';
import { SWLogger } from '../../../logger';

export interface ExtractedFunction {
    name: string;
    file: string;
    startLine: number;
    endLine: number;
    lines: number;
    language: string;
    complexity: 'low' | 'medium' | 'high';
    is_public: boolean;
    is_async: boolean;
    parameters: string[];
    return_type: string;
    dependencies: string[];
    calls_external_apis?: boolean;
    requires_mocking: boolean;
    testability: 'low' | 'medium' | 'high';
    reason?: string;
}

export interface FunctionExtractionResult {
    functions: ExtractedFunction[];
    total_functions: number;
    files_analyzed: number;
}

export class LLMFunctionExtractionService {
    /**
     * Extract functions from all code files in workspace using LLM
     */
    static async extractFunctionsFromWorkspace(
        workspaceRoot: string,
        codeFiles: string[],
        llmService: any,
        maxFilesPerBatch: number = 5
    ): Promise<ExtractedFunction[]> {
        SWLogger.log(`[FunctionExtraction] Analyzing ${codeFiles.length} files...`);
        
        const allFunctions: ExtractedFunction[] = [];
        
        // Process files in batches to avoid token limits
        for (let i = 0; i < codeFiles.length; i += maxFilesPerBatch) {
            const batch = codeFiles.slice(i, i + maxFilesPerBatch);
            
            SWLogger.log(`[FunctionExtraction] Processing batch ${Math.floor(i / maxFilesPerBatch) + 1}/${Math.ceil(codeFiles.length / maxFilesPerBatch)}...`);
            
            const filesData = batch.map(filePath => {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const relativePath = path.relative(workspaceRoot, filePath);
                    const ext = path.extname(filePath);
                    const language = this.getLanguageFromExtension(ext);
                    
                    return {
                        path: relativePath,
                        content,
                        language
                    };
                } catch (error) {
                    SWLogger.log(`[FunctionExtraction] Error reading ${filePath}: ${error}`);
                    return null;
                }
            }).filter(f => f !== null) as Array<{ path: string; content: string; language: string }>;
            
            if (filesData.length === 0) {
                continue;
            }
            
            try {
                const prompt = buildFunctionExtractionPrompt(filesData);
                const result = await llmService.generateTestStrategy(prompt);
                
                if (result.functions && Array.isArray(result.functions)) {
                    allFunctions.push(...result.functions);
                    SWLogger.log(`[FunctionExtraction] Extracted ${result.functions.length} functions from batch`);
                }
            } catch (error) {
                SWLogger.log(`[FunctionExtraction] Error extracting from batch: ${error}`);
                // Continue with next batch
            }
        }
        
        SWLogger.log(`[FunctionExtraction] Total extracted: ${allFunctions.length} functions`);
        return allFunctions;
    }
    
    /**
     * Extract functions from a single file
     */
    static async extractFunctionsFromFile(
        filePath: string,
        workspaceRoot: string,
        llmService: any
    ): Promise<ExtractedFunction[]> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(workspaceRoot, filePath);
            const ext = path.extname(filePath);
            const language = this.getLanguageFromExtension(ext);
            
            const prompt = buildSingleFileExtractionPrompt(relativePath, content, language);
            const result = await llmService.generateTestStrategy(prompt);
            
            if (result.functions && Array.isArray(result.functions)) {
                SWLogger.log(`[FunctionExtraction] Extracted ${result.functions.length} functions from ${relativePath}`);
                return result.functions;
            }
            
            return [];
        } catch (error) {
            SWLogger.log(`[FunctionExtraction] Error extracting from ${filePath}: ${error}`);
            return [];
        }
    }
    
    /**
     * Convert extracted functions to format expected by test generation
     */
    static convertToTestPlanFormat(functions: ExtractedFunction[]): any[] {
        return functions.map(func => ({
            name: func.name,
            file: func.file,
            startLine: func.startLine,
            endLine: func.endLine,
            lines: func.lines,
            complexity: func.complexity,
            parameters: func.parameters,
            returnType: func.return_type,
            dependencies: func.dependencies,
            mocking_needed: func.requires_mocking,
            testability: func.testability,
            isPublic: func.is_public,
            isAsync: func.is_async
        }));
    }
    
    /**
     * Get language identifier from file extension
     */
    private static getLanguageFromExtension(ext: string): string {
        const langMap: { [key: string]: string } = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.hpp': 'cpp',
            '.rb': 'ruby',
            '.php': 'php'
        };
        
        return langMap[ext] || 'unknown';
    }
}
