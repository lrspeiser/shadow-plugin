/**
 * Analysis Planner Service
 * 
 * First LLM call that examines project structure and creates an execution plan.
 * Keeps subsequent LLM calls small and focused.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SWLogger } from '../../../logger';

export interface ProjectSummary {
    totalFiles: number;
    totalLines: number;
    folders: FolderInfo[];
    languages: { [ext: string]: number };
    hasPackageJson: boolean;
    hasTests: boolean;
    entryPoints: string[];
}

export interface FolderInfo {
    path: string;
    fileCount: number;
    totalLines: number;
    extensions: string[];
}

export interface AnalysisPlan {
    projectSize: 'tiny' | 'small' | 'medium' | 'large';
    phases: AnalysisPhase[];
    estimatedCalls: number;
    skipReasons: string[];
}

export interface AnalysisPhase {
    name: string;
    description: string;
    files: string[];
    prompt: string;
    outputSchema: string;
}

/**
 * Scan project structure without reading file contents
 */
export function scanProjectStructure(workspaceRoot: string): ProjectSummary {
    const summary: ProjectSummary = {
        totalFiles: 0,
        totalLines: 0,
        folders: [],
        languages: {},
        hasPackageJson: false,
        hasTests: false,
        entryPoints: []
    };

    const skipDirs = new Set(['node_modules', '.git', '.shadow', 'dist', 'build', 'coverage', '__pycache__']);
    const codeExtensions = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h']);

    function walkDir(dir: string, relPath: string = '') {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            let folderFiles = 0;
            let folderLines = 0;
            const folderExts: Set<string> = new Set();

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;

                if (entry.isDirectory()) {
                    if (!skipDirs.has(entry.name) && !entry.name.startsWith('.')) {
                        walkDir(fullPath, entryRelPath);
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    
                    // Check for special files
                    if (entry.name === 'package.json') summary.hasPackageJson = true;
                    if (entry.name.includes('.test.') || entry.name.includes('.spec.') || entry.name.includes('_test.')) {
                        summary.hasTests = true;
                    }
                    if (entry.name === 'index.js' || entry.name === 'index.ts' || entry.name === 'main.py' || entry.name === 'main.go') {
                        summary.entryPoints.push(entryRelPath);
                    }

                    // Count code files
                    if (codeExtensions.has(ext)) {
                        summary.totalFiles++;
                        folderFiles++;
                        folderExts.add(ext);
                        
                        // Count lines (quick stat-based estimate or actual count for small files)
                        try {
                            const stats = fs.statSync(fullPath);
                            // Rough estimate: ~40 bytes per line on average
                            const estimatedLines = Math.ceil(stats.size / 40);
                            summary.totalLines += estimatedLines;
                            folderLines += estimatedLines;
                        } catch {
                            // Skip if can't read
                        }

                        // Track language distribution
                        summary.languages[ext] = (summary.languages[ext] || 0) + 1;
                    }
                }
            }

            if (folderFiles > 0) {
                summary.folders.push({
                    path: relPath || '.',
                    fileCount: folderFiles,
                    totalLines: folderLines,
                    extensions: Array.from(folderExts)
                });
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }

    walkDir(workspaceRoot);
    return summary;
}

/**
 * Build the planner prompt - sends project structure to LLM to get execution plan
 */
export function buildPlannerPrompt(summary: ProjectSummary): string {
    const folderList = summary.folders
        .sort((a, b) => b.fileCount - a.fileCount)
        .slice(0, 20)
        .map(f => `- ${f.path}: ${f.fileCount} files, ~${f.totalLines} lines [${f.extensions.join(', ')}]`)
        .join('\n');

    const langList = Object.entries(summary.languages)
        .sort((a, b) => b[1] - a[1])
        .map(([ext, count]) => `${ext}: ${count} files`)
        .join(', ');

    return `You are an analysis planner. Given this project structure, create an efficient analysis plan.

## Project Summary
- Total code files: ${summary.totalFiles}
- Estimated lines: ${summary.totalLines}
- Languages: ${langList}
- Has package.json: ${summary.hasPackageJson}
- Has existing tests: ${summary.hasTests}
- Entry points found: ${summary.entryPoints.join(', ') || 'none detected'}

## Folder Structure
${folderList}

## Your Task
Create an analysis plan. Return JSON:

{
  "projectSize": "tiny|small|medium|large",
  "analysisApproach": "Brief description of how to analyze this project",
  "keyFiles": ["list of most important files to analyze first"],
  "skipPatterns": ["patterns to skip like test files, configs"],
  "phases": [
    {
      "name": "phase name",
      "purpose": "what this phase extracts",
      "targetFiles": "which files this applies to",
      "priority": 1
    }
  ],
  "estimatedLLMCalls": 3,
  "recommendations": ["any special notes about this codebase"]
}

Guidelines:
- tiny (≤5 files): Single LLM call for everything
- small (6-20 files): 2-3 focused calls
- medium (21-100 files): Group by module, 5-10 calls max
- large (100+ files): Sample key files, 10-15 calls max

Keep it simple. Small projects need minimal analysis.`;
}

/**
 * Schema for the planner response
 */
export const plannerResponseSchema = {
    type: "object",
    properties: {
        projectSize: {
            type: "string",
            enum: ["tiny", "small", "medium", "large"]
        },
        analysisApproach: {
            type: "string",
            description: "Brief description of analysis strategy"
        },
        keyFiles: {
            type: "array",
            items: { type: "string" },
            description: "Most important files to analyze"
        },
        skipPatterns: {
            type: "array",
            items: { type: "string" },
            description: "File patterns to skip"
        },
        phases: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    purpose: { type: "string" },
                    targetFiles: { type: "string" },
                    priority: { type: "number" }
                },
                required: ["name", "purpose", "targetFiles", "priority"]
            }
        },
        estimatedLLMCalls: {
            type: "number",
            description: "Expected number of LLM calls"
        },
        recommendations: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: ["projectSize", "analysisApproach", "keyFiles", "phases", "estimatedLLMCalls"]
};

/**
 * Simple extraction prompts for each phase type
 */
export const EXTRACTION_PROMPTS = {
    // For tiny projects - single call that gets everything
    comprehensive: `Analyze this code and extract:

{CODE}

Return JSON:
{
  "overview": "1-2 sentence description of what this code does",
  "functions": [
    {"name": "funcName", "purpose": "what it does", "file": "path", "lines": [start, end]}
  ],
  "dependencies": ["external deps used"],
  "issues": ["any code quality issues"],
  "testTargets": [
    {"function": "name", "priority": "high|medium", "reason": "why test this"}
  ]
}`,

    // For extracting what a single file does
    fileAnalysis: `Analyze this file:

{CODE}

Return JSON:
{
  "purpose": "what this file does",
  "exports": ["exported functions/classes"],
  "dependencies": ["imports used"],
  "complexity": "low|medium|high"
}`,

    // For extracting architecture overview
    architecture: `Given these file summaries:

{SUMMARIES}

Return JSON:
{
  "overview": "what this project does",
  "architecture": "how it's structured",
  "strengths": ["good things"],
  "issues": ["problems found"],
  "testPriorities": [{"function": "name", "file": "path", "reason": "why"}]
}`
};

export class AnalysisPlannerService {
    /**
     * Create analysis plan for a project
     */
    static async createPlan(
        workspaceRoot: string,
        llmService: any
    ): Promise<{ summary: ProjectSummary; plan: any }> {
        SWLogger.log('[Planner] Scanning project structure...');
        const summary = scanProjectStructure(workspaceRoot);
        
        SWLogger.log(`[Planner] Found ${summary.totalFiles} files, ~${summary.totalLines} lines`);
        SWLogger.log(`[Planner] Languages: ${Object.entries(summary.languages).map(([k,v]) => `${k}:${v}`).join(', ')}`);
        
        // For very tiny projects, skip the planner call entirely
        if (summary.totalFiles <= 3) {
            SWLogger.log('[Planner] Tiny project - using preset plan (no planner LLM call)');
            return {
                summary,
                plan: {
                    projectSize: 'tiny',
                    analysisApproach: 'Single comprehensive analysis',
                    keyFiles: summary.folders.flatMap(f => []),
                    skipPatterns: ['*.test.*', '*.spec.*', 'node_modules'],
                    phases: [
                        { name: 'comprehensive', purpose: 'Full analysis', targetFiles: 'all', priority: 1 }
                    ],
                    estimatedLLMCalls: 1,
                    recommendations: []
                }
            };
        }
        
        // For larger projects, ask LLM to plan
        SWLogger.log('[Planner] Asking LLM to create analysis plan...');
        const prompt = buildPlannerPrompt(summary);
        
        const response = await llmService.sendStructuredRequest(
            prompt,
            plannerResponseSchema,
            'Create an efficient analysis plan for this project.'
        );
        
        SWLogger.log(`[Planner] Plan created: ${response.projectSize} project, ${response.estimatedLLMCalls} estimated calls`);
        
        return { summary, plan: response };
    }
}
