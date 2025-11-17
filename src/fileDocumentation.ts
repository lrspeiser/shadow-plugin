/**
 * File-level documentation system following the blueprint:
 * 1. File-level summaries
 * 2. Module-level rollups
 * 3. Product-level docs
 * 4. Full aggregation
 */

import * as fs from 'fs';
import * as path from 'path';
import { CodeAnalysis, FileInfo } from './analyzer';

export interface FileSummary {
    file: string;
    role: string; // CLI entrypoint, API route, Worker, GUI view, Core logic, Utility, Contract/interface
    purpose: string;
    userVisibleActions: string[];
    developerVisibleActions: string[];
    keyFunctions: Array<{
        name: string;
        desc: string;
        inputs?: string;
        outputs?: string;
    }>;
    dependencies: string[];
    intent: string; // Why does this file exist?
    rawContent?: string; // Store raw LLM response
}

export interface ModuleSummary {
    module: string; // Directory path
    moduleType: string; // 'api', 'cli', 'workers', 'core', 'gui', etc.
    capabilities: string[];
    summary: string;
    files: FileSummary[];
    endpoints?: Array<{
        path: string;
        method?: string;
        description: string;
    }>;
    commands?: Array<{
        command: string;
        description: string;
    }>;
    workers?: Array<{
        name: string;
        description: string;
        jobFlow: string;
    }>;
}

export interface EnhancedProductDocumentation {
    // Product Overview
    overview: string;
    whatItDoes: string[];
    userPerspective: {
        gui?: string[];
        cli?: string[];
        api?: string[];
        cicd?: string[];
    };
    workflowIntegration: string[];
    problemsSolved: string[];

    // Architecture Summary
    architecture: string;
    componentDiagram?: string; // Mermaid diagram
    flowDiagram?: string;

    // Structured JSON fields
    titles?: string[]; // Key titles/names of features, modules, components
    descriptions?: Array<{
        title: string;
        description: string;
        category?: string; // e.g., "feature", "module", "component"
    }>;
    relevantFunctions?: Array<{
        name: string;
        description: string;
        file?: string;
        module?: string;
    }>;
    relevantDataStructures?: Array<{
        name: string;
        description: string;
        type?: string; // e.g., "class", "interface", "type", "model"
        file?: string;
    }>;
    relevantCodeFiles?: Array<{
        path: string;
        description: string;
        purpose: string;
        role?: string;
    }>;
    exampleInput?: {
        description?: string;
        json?: any;
    };
    exampleOutput?: {
        description?: string;
        json?: any;
    };

    // Module Documentation
    modules: ModuleSummary[];

    // File-Level Documentation (Appendix)
    fileSummaries: FileSummary[];

    // Legacy fields for backward compatibility
    features?: string[];
    techStack?: string[];
    apiEndpoints?: string[];
    dataModels?: string[];
    userFlows?: string[];
    rawContent?: string;
}

/**
 * Detect file role/type based on path, name, and content
 */
export function detectFileRole(filePath: string, fileInfo: FileInfo): string {
    const fileName = path.basename(filePath).toLowerCase();
    const dirPath = path.dirname(filePath).toLowerCase();

    // CLI entrypoints
    if (fileName === 'main.py' || fileName === 'main.ts' || fileName === 'main.js' || 
        fileName === 'cli.py' || fileName === 'cli.ts' || fileName.includes('cli') ||
        dirPath.includes('cli') || dirPath.includes('bin')) {
        return 'CLI Entrypoint';
    }

    // API routes
    if (fileName.includes('router') || fileName.includes('route') || 
        fileName.includes('api') || dirPath.includes('api') || 
        dirPath.includes('routes') || dirPath.includes('endpoints')) {
        return 'API Route';
    }

    // Workers
    if (fileName.includes('worker') || fileName.includes('job') || 
        fileName.includes('task') || dirPath.includes('worker') || 
        dirPath.includes('jobs') || dirPath.includes('tasks')) {
        return 'Worker';
    }

    // GUI views
    if (fileName.includes('view') || fileName.includes('component') || 
        fileName.includes('page') || dirPath.includes('views') || 
        dirPath.includes('components') || dirPath.includes('pages') ||
        fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
        return 'GUI View';
    }

    // Core logic
    if (dirPath.includes('core') || dirPath.includes('lib') || 
        dirPath.includes('src') || dirPath.includes('engine')) {
        return 'Core Logic';
    }

    // Utilities
    if (fileName.includes('util') || fileName.includes('helper') || 
        fileName.includes('common') || dirPath.includes('utils') || 
        dirPath.includes('helpers') || dirPath.includes('common')) {
        return 'Utility';
    }

    // Contracts/interfaces
    if (fileName.includes('interface') || fileName.includes('contract') || 
        fileName.includes('schema') || fileName.includes('type') || 
        fileName.includes('model') || dirPath.includes('types') || 
        dirPath.includes('schemas') || dirPath.includes('models')) {
        return 'Contract/Interface';
    }

    // Default
    return 'Core Logic';
}

/**
 * Group files by module (directory)
 */
export function groupFilesByModule(files: FileInfo[]): Map<string, FileInfo[]> {
    const modules = new Map<string, FileInfo[]>();

    for (const file of files) {
        const dir = path.dirname(file.path);
        const moduleName = dir || 'root';
        
        if (!modules.has(moduleName)) {
            modules.set(moduleName, []);
        }
        modules.get(moduleName)!.push(file);
    }

    return modules;
}

/**
 * Detect module type from directory path
 */
export function detectModuleType(modulePath: string): string {
    const lowerPath = modulePath.toLowerCase();
    
    if (lowerPath.includes('api') || lowerPath.includes('routes') || lowerPath.includes('endpoints')) {
        return 'api';
    }
    if (lowerPath.includes('cli') || lowerPath.includes('bin') || lowerPath.includes('command')) {
        return 'cli';
    }
    if (lowerPath.includes('worker') || lowerPath.includes('job') || lowerPath.includes('task')) {
        return 'workers';
    }
    if (lowerPath.includes('core') || lowerPath.includes('lib') || lowerPath.includes('engine')) {
        return 'core';
    }
    if (lowerPath.includes('gui') || lowerPath.includes('ui') || lowerPath.includes('frontend') || 
        lowerPath.includes('views') || lowerPath.includes('components')) {
        return 'gui';
    }
    if (lowerPath.includes('test') || lowerPath.includes('spec')) {
        return 'tests';
    }
    
    return 'other';
}

/**
 * Read file content for analysis
 */
export async function readFileContent(filePath: string, workspaceRoot: string): Promise<string | null> {
    try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(workspaceRoot, filePath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath, 'utf-8');
        }
    } catch (error) {
        console.error(`Failed to read file ${filePath}:`, error);
    }
    return null;
}

