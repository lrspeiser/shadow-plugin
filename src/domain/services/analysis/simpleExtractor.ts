/**
 * Simple Extractor Service
 * 
 * Executes focused LLM calls with minimal prompts.
 * Each call extracts one specific thing with a clear JSON schema.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SWLogger } from '../../../logger';

// ============================================================================
// SCHEMAS - What we want back from each extraction type
// ============================================================================

export const SCHEMAS = {
    // Comprehensive analysis for tiny projects (1-3 files)
    tinyProject: {
        type: "object",
        properties: {
            overview: { type: "string", description: "What this code does in 1-2 sentences" },
            functions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        purpose: { type: "string" },
                        file: { type: "string" },
                        startLine: { type: "number" },
                        endLine: { type: "number" }
                    },
                    required: ["name", "purpose", "file"]
                }
            },
            dependencies: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            issues: { type: "array", items: { type: "string" } },
            testTargets: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        function: { type: "string" },
                        file: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        reason: { type: "string" },
                        edgeCases: { type: "array", items: { type: "string" } }
                    },
                    required: ["function", "file", "priority", "reason"]
                }
            }
        },
        required: ["overview", "functions", "testTargets"]
    },

    // Single file analysis
    fileAnalysis: {
        type: "object",
        properties: {
            purpose: { type: "string" },
            exports: { type: "array", items: { type: "string" } },
            functions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        purpose: { type: "string" },
                        params: { type: "string" },
                        returns: { type: "string" }
                    },
                    required: ["name", "purpose"]
                }
            },
            dependencies: { type: "array", items: { type: "string" } },
            complexity: { type: "string", enum: ["low", "medium", "high"] }
        },
        required: ["purpose", "functions"]
    },

    // Architecture synthesis from file summaries
    architecture: {
        type: "object",
        properties: {
            overview: { type: "string" },
            architecture: { type: "string" },
            modules: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        purpose: { type: "string" },
                        files: { type: "array", items: { type: "string" } }
                    },
                    required: ["name", "purpose"]
                }
            },
            strengths: { type: "array", items: { type: "string" } },
            issues: { type: "array", items: { type: "string" } },
            testPriorities: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        function: { type: "string" },
                        file: { type: "string" },
                        priority: { type: "string" },
                        reason: { type: "string" }
                    },
                    required: ["function", "file", "reason"]
                }
            }
        },
        required: ["overview", "architecture", "strengths", "issues", "testPriorities"]
    }
};

// ============================================================================
// PROMPTS - Minimal prompts with clear examples
// ============================================================================

/**
 * Build prompt for tiny project analysis (all files at once)
 */
export function buildTinyProjectPrompt(files: { path: string; content: string }[]): string {
    const fileContents = files.map(f => 
        `=== ${f.path} ===\n${f.content}`
    ).join('\n\n');

    return `Analyze this small codebase:

${fileContents}

Extract: overview, functions, dependencies, strengths, issues, and which functions need unit tests.

Example response:
{
  "overview": "A math utility library with basic arithmetic operations",
  "functions": [
    {"name": "add", "purpose": "Adds two numbers", "file": "src/math.js", "startLine": 5, "endLine": 7}
  ],
  "dependencies": ["lodash"],
  "strengths": ["Clean function signatures", "Good error handling"],
  "issues": ["No input validation"],
  "testTargets": [
    {"function": "divide", "file": "src/math.js", "priority": "high", "reason": "Division by zero edge case", "edgeCases": ["zero divisor", "negative numbers"]}
  ]
}`;
}

/**
 * Build prompt for single file analysis
 */
export function buildFilePrompt(filePath: string, content: string): string {
    return `Analyze this file:

=== ${filePath} ===
${content}

Extract: purpose, exports, functions, dependencies, complexity.

Example response:
{
  "purpose": "Handles user authentication",
  "exports": ["login", "logout", "validateToken"],
  "functions": [
    {"name": "login", "purpose": "Authenticates user credentials", "params": "username, password", "returns": "Promise<User>"}
  ],
  "dependencies": ["bcrypt", "jwt"],
  "complexity": "medium"
}`;
}

/**
 * Build prompt for architecture synthesis
 */
export function buildArchitecturePrompt(fileSummaries: { path: string; purpose: string; functions: any[] }[]): string {
    const summaryText = fileSummaries.map(f => 
        `- ${f.path}: ${f.purpose} [${f.functions?.map(fn => fn.name).join(', ') || 'no functions'}]`
    ).join('\n');

    return `Synthesize architecture from these file summaries:

${summaryText}

Extract: overview, architecture description, modules, strengths, issues, and test priorities.

Example response:
{
  "overview": "A REST API for managing user accounts",
  "architecture": "Layered architecture with controllers, services, and data access",
  "modules": [
    {"name": "auth", "purpose": "User authentication", "files": ["src/auth/login.ts", "src/auth/token.ts"]}
  ],
  "strengths": ["Clear separation of concerns", "Consistent error handling"],
  "issues": ["Missing input validation in controllers"],
  "testPriorities": [
    {"function": "validateUser", "file": "src/auth/login.ts", "priority": "high", "reason": "Security critical"}
  ]
}`;
}

// ============================================================================
// EXTRACTOR SERVICE
// ============================================================================

export interface ExtractorResult {
    type: 'tiny' | 'file' | 'architecture';
    data: any;
    tokensUsed: { input: number; output: number };
    timeMs: number;
}

export class SimpleExtractorService {
    /**
     * Analyze a tiny project (1-5 files) in a single LLM call
     */
    static async analyzeTinyProject(
        workspaceRoot: string,
        files: string[],
        llmService: any
    ): Promise<ExtractorResult> {
        SWLogger.log(`[Extractor] Analyzing tiny project with ${files.length} files`);
        
        // Read all files
        const fileContents: { path: string; content: string }[] = [];
        for (const file of files) {
            const fullPath = path.join(workspaceRoot, file);
            try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                // Truncate very long files
                const truncated = content.length > 5000 ? content.substring(0, 5000) + '\n... (truncated)' : content;
                fileContents.push({ path: file, content: truncated });
            } catch {
                SWLogger.log(`[Extractor] Could not read ${file}`);
            }
        }

        const prompt = buildTinyProjectPrompt(fileContents);
        SWLogger.log(`[Extractor] Prompt size: ${prompt.length} chars`);

        const startTime = Date.now();
        const response = await llmService.sendStructuredRequest(
            prompt,
            SCHEMAS.tinyProject,
            'Analyze this code and extract the requested information.'
        );
        const elapsed = Date.now() - startTime;

        SWLogger.log(`[Extractor] Tiny project analysis complete in ${elapsed}ms`);
        
        return {
            type: 'tiny',
            data: response.data,
            tokensUsed: { input: 0, output: 0 },
            timeMs: elapsed
        };
    }

    /**
     * Analyze a single file
     */
    static async analyzeFile(
        workspaceRoot: string,
        filePath: string,
        llmService: any
    ): Promise<ExtractorResult> {
        const fullPath = path.join(workspaceRoot, filePath);
        let content = fs.readFileSync(fullPath, 'utf-8');
        
        // Truncate long files
        if (content.length > 8000) {
            content = content.substring(0, 8000) + '\n... (truncated)';
        }

        const prompt = buildFilePrompt(filePath, content);
        SWLogger.log(`[Extractor] Analyzing file ${filePath} (${prompt.length} chars)`);

        const startTime = Date.now();
        const response = await llmService.sendStructuredRequest(
            prompt,
            SCHEMAS.fileAnalysis,
            'Analyze this file and extract the requested information.'
        );
        const elapsed = Date.now() - startTime;

        return {
            type: 'file',
            data: { ...response.data, file: filePath },
            tokensUsed: { input: 0, output: 0 },
            timeMs: elapsed
        };
    }

    /**
     * Synthesize architecture from file summaries
     */
    static async synthesizeArchitecture(
        fileSummaries: { path: string; purpose: string; functions: any[] }[],
        llmService: any
    ): Promise<ExtractorResult> {
        const prompt = buildArchitecturePrompt(fileSummaries);
        SWLogger.log(`[Extractor] Synthesizing architecture from ${fileSummaries.length} files`);

        const startTime = Date.now();
        const response = await llmService.sendStructuredRequest(
            prompt,
            SCHEMAS.architecture,
            'Synthesize architecture insights from these file summaries.'
        );
        const elapsed = Date.now() - startTime;

        return {
            type: 'architecture',
            data: response.data,
            tokensUsed: { input: 0, output: 0 },
            timeMs: elapsed
        };
    }
}
