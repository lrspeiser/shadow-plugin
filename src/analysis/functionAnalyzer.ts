/**
 * Function Analyzer - Extracts detailed function information for refactoring reports
 * Builds on existing analyzer infrastructure to provide function signatures,
 * dependencies, dependents, and responsibilities
 */
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { FunctionInfo, FunctionMetadata, CodeAnalysis } from '../analyzer';
import { FunctionAnalysis } from '../domain/prompts/refactoringPromptBuilder';

export class FunctionAnalyzer {
    /**
     * Analyze all functions in large files and extract detailed information
     */
    async analyzeFunctions(
        codeAnalysis: CodeAnalysis,
        largeFileThreshold: number = 500
    ): Promise<FunctionAnalysis[]> {
        const largeFiles = codeAnalysis.files.filter(f => f.lines > largeFileThreshold);
        const analyses: FunctionAnalysis[] = [];

        for (const file of largeFiles) {
            const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
            
            for (const func of fileFunctions) {
                try {
                    const analysis = await this.analyzeFunction(
                        file.path,
                        func,
                        codeAnalysis
                    );
                    if (analysis) {
                        analyses.push(analysis);
                    }
                } catch (error) {
                    console.warn(`Failed to analyze function ${func.name} in ${file.path}:`, error);
                }
            }
        }

        return analyses;
    }

    /**
     * Analyze a single function in detail
     */
    private async analyzeFunction(
        filePath: string,
        func: FunctionInfo,
        codeAnalysis: CodeAnalysis
    ): Promise<FunctionAnalysis | null> {
        try {
            const fullPath = this.resolveFilePath(filePath, codeAnalysis);
            if (!fullPath || !fs.existsSync(fullPath)) {
                return null;
            }

            const content = fs.readFileSync(fullPath, 'utf-8');
            
            if (func.language === 'typescript' || func.language === 'javascript') {
                return this.analyzeTypeScriptFunction(filePath, func, content, codeAnalysis);
            }

            // Fallback for other languages
            return this.analyzeFunctionWithRegex(filePath, func, content, codeAnalysis);
        } catch (error) {
            console.warn(`Error analyzing function ${func.name}:`, error);
            return null;
        }
    }

    /**
     * Analyze TypeScript/JavaScript function using AST
     */
    private analyzeTypeScriptFunction(
        filePath: string,
        func: FunctionInfo,
        content: string,
        codeAnalysis: CodeAnalysis
    ): FunctionAnalysis | null {
        try {
            const sourceFile = ts.createSourceFile(
                filePath,
                content,
                ts.ScriptTarget.Latest,
                true
            );

            const functionNode = this.findFunctionNode(sourceFile, func.name, func.startLine);
            if (!functionNode) {
                return this.analyzeFunctionWithRegex(filePath, func, content, codeAnalysis);
            }

            const signature = this.extractSignature(functionNode, content);
            const parameters = this.extractParameters(functionNode);
            const returnType = this.extractReturnType(functionNode);
            const isPublic = this.isPublic(functionNode);
            const isAsync = this.isAsync(functionNode);
            
            // Extract dependencies (what this function calls)
            const dependencies = this.extractDependencies(functionNode, sourceFile, codeAnalysis);
            
            // Extract dependents (what calls this function)
            const dependents = this.extractDependents(func, codeAnalysis);
            
            // Extract responsibilities
            const responsibilities = this.extractResponsibilities(functionNode, content);

            return {
                file: filePath,
                name: func.name,
                signature,
                startLine: func.startLine,
                endLine: func.endLine,
                lines: func.lines,
                parameters,
                returnType: returnType || 'unknown',
                isPublic,
                isAsync,
                dependencies,
                dependents,
                responsibilities
            };
        } catch (error) {
            console.warn(`AST analysis failed for ${func.name}, using regex:`, error);
            return this.analyzeFunctionWithRegex(filePath, func, content, codeAnalysis);
        }
    }

    /**
     * Fallback regex-based analysis
     */
    private analyzeFunctionWithRegex(
        filePath: string,
        func: FunctionInfo,
        content: string,
        codeAnalysis: CodeAnalysis
    ): FunctionAnalysis {
        const lines = content.split('\n');
        const funcLines = lines.slice(func.startLine - 1, func.endLine);
        const funcContent = funcLines.join('\n');

        // Extract signature using regex
        const signatureMatch = funcContent.match(/(?:public|private|protected|async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)/);
        const signature = signatureMatch 
            ? funcContent.substring(0, funcContent.indexOf('{')).trim()
            : `${func.name}()`;

        // Extract parameters
        const paramMatch = funcContent.match(/\(([^)]*)\)/);
        const parameters = paramMatch 
            ? paramMatch[1].split(',').map(p => p.trim()).filter(Boolean)
            : [];

        // Check if async
        const isAsync = /async\s+/.test(funcContent);

        // Check if public (default for functions, private for methods)
        const isPublic = !/private|protected/.test(funcContent);

        // Extract dependencies (simple regex-based)
        const dependencies = this.extractDependenciesRegex(funcContent, codeAnalysis);
        
        // Extract dependents
        const dependents = this.extractDependents(func, codeAnalysis);

        // Extract responsibilities (simple heuristics)
        const responsibilities = this.extractResponsibilitiesRegex(funcContent);

        return {
            file: filePath,
            name: func.name,
            signature,
            startLine: func.startLine,
            endLine: func.endLine,
            lines: func.lines,
            parameters,
            returnType: 'unknown',
            isPublic,
            isAsync,
            dependencies,
            dependents,
            responsibilities
        };
    }

    /**
     * Find function node in AST
     */
    private findFunctionNode(
        sourceFile: ts.SourceFile,
        functionName: string,
        startLine: number
    ): ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression | null {
        let found: ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression | null = null;

        const visit = (node: ts.Node) => {
            if (found) return;

            const nodeLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            
            if (
                (ts.isFunctionDeclaration(node) || 
                 ts.isMethodDeclaration(node) || 
                 ts.isFunctionExpression(node)) &&
                nodeLine === startLine
            ) {
                const name = ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)
                    ? node.name?.getText(sourceFile)
                    : undefined;
                
                if (name === functionName || (!name && ts.isFunctionExpression(node))) {
                    found = node as any;
                    return;
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(sourceFile);
        return found;
    }

    /**
     * Extract function signature
     */
    private extractSignature(
        node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression,
        content: string
    ): string {
        const start = node.getStart();
        let end = node.getEnd();
        
        // Get body start if available
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
            if (node.body) {
                end = node.body.getStart();
            }
        } else if (ts.isFunctionExpression(node)) {
            if (node.body) {
                end = node.body.getStart();
            }
        }
        
        return content.substring(start, end).trim();
    }

    /**
     * Extract parameters
     */
    private extractParameters(
        node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression
    ): string[] {
        const parameters: string[] = [];
        
        let paramList: ts.NodeArray<ts.ParameterDeclaration> | undefined;
        
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
            paramList = node.parameters;
        } else if (ts.isFunctionExpression(node)) {
            paramList = node.parameters;
        }

        if (paramList) {
            for (const param of paramList) {
                const name = param.name.getText();
                const type = param.type?.getText() || '';
                const optional = param.questionToken ? '?' : '';
                const defaultValue = param.initializer?.getText() || '';
                
                let paramStr = name + optional;
                if (type) paramStr += `: ${type}`;
                if (defaultValue) paramStr += ` = ${defaultValue}`;
                
                parameters.push(paramStr);
            }
        }

        return parameters;
    }

    /**
     * Extract return type
     */
    private extractReturnType(
        node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression
    ): string | null {
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
            return node.type?.getText() || null;
        }
        return null;
    }

    /**
     * Check if function is public
     */
    private isPublic(
        node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression
    ): boolean {
        if (ts.isMethodDeclaration(node)) {
            const modifiers = ts.getModifiers(node);
            if (modifiers) {
                return !modifiers.some(m => 
                    m.kind === ts.SyntaxKind.PrivateKeyword ||
                    m.kind === ts.SyntaxKind.ProtectedKeyword
                );
            }
        }
        // Functions are public by default
        return true;
    }

    /**
     * Check if function is async
     */
    private isAsync(
        node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression
    ): boolean {
        const modifiers = ts.getModifiers(node);
        if (modifiers) {
            return modifiers.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);
        }
        return false;
    }

    /**
     * Extract dependencies (what this function calls)
     */
    private extractDependencies(
        node: ts.Node,
        sourceFile: ts.SourceFile,
        codeAnalysis: CodeAnalysis
    ): string[] {
        const dependencies: string[] = [];
        const functionNames = new Set(codeAnalysis.functions.map(f => f.name));

        const visit = (n: ts.Node) => {
            // Look for function calls
            if (ts.isCallExpression(n)) {
                const expression = n.expression;
                if (ts.isIdentifier(expression)) {
                    const name = expression.getText(sourceFile);
                    if (functionNames.has(name)) {
                        dependencies.push(name);
                    }
                } else if (ts.isPropertyAccessExpression(expression)) {
                    const name = expression.name.getText(sourceFile);
                    if (functionNames.has(name)) {
                        dependencies.push(name);
                    }
                }
            }

            ts.forEachChild(n, visit);
        };

        visit(node);
        return Array.from(new Set(dependencies));
    }

    /**
     * Extract dependencies using regex (fallback)
     */
    private extractDependenciesRegex(
        funcContent: string,
        codeAnalysis: CodeAnalysis
    ): string[] {
        const dependencies: string[] = [];
        const functionNames = new Set(codeAnalysis.functions.map(f => f.name));

        // Simple regex to find function calls
        const callPattern = /(\w+)\s*\(/g;
        let match;
        while ((match = callPattern.exec(funcContent)) !== null) {
            const name = match[1];
            if (functionNames.has(name) && !dependencies.includes(name)) {
                dependencies.push(name);
            }
        }

        return dependencies;
    }

    /**
     * Extract dependents (what calls this function)
     */
    private extractDependents(
        func: FunctionInfo,
        codeAnalysis: CodeAnalysis
    ): string[] {
        const dependents: string[] = [];

        // Search through all functions to find callers
        for (const otherFunc of codeAnalysis.functions) {
            if (otherFunc.name === func.name && otherFunc.file === func.file) {
                continue; // Skip self
            }

            // This is a simplified check - in a real implementation,
            // we'd need to parse each function's content
            // For now, we'll use the function metadata if available
            if (codeAnalysis.functionMetadata) {
                const metadata = codeAnalysis.functionMetadata.get(otherFunc.name);
                if (metadata) {
                    const hasDependency = metadata.dependencies.some(
                        dep => dep.name === func.name
                    );
                    if (hasDependency) {
                        dependents.push(otherFunc.name);
                    }
                }
            }
        }

        return dependents;
    }

    /**
     * Extract responsibilities (what this function does)
     */
    private extractResponsibilities(
        node: ts.Node,
        content: string
    ): string[] {
        const responsibilities: string[] = [];
        const body = ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isFunctionExpression(node)
            ? node.body
            : null;

        if (!body) return responsibilities;

        const bodyText = content.substring(body.getStart(), body.getEnd());

        // Heuristic-based responsibility detection
        if (/await.*sendRequest|fetch|axios|http/.test(bodyText)) {
            responsibilities.push('API Communication');
        }
        if (/parse|JSON\.parse|XML\.parse/.test(bodyText)) {
            responsibilities.push('Response Parsing');
        }
        if (/rateLimit|throttle|wait/.test(bodyText)) {
            responsibilities.push('Rate Limiting');
        }
        if (/retry|catch.*retry/.test(bodyText)) {
            responsibilities.push('Retry Logic');
        }
        if (/cache|Cache|setItem|getItem/.test(bodyText)) {
            responsibilities.push('Caching');
        }
        if (/setState|update|save|persist/.test(bodyText)) {
            responsibilities.push('State Management');
        }
        if (/try.*catch|Error|throw/.test(bodyText)) {
            responsibilities.push('Error Handling');
        }
        if (/format|Format|template|Template/.test(bodyText)) {
            responsibilities.push('Formatting');
        }
        if (/readFile|writeFile|fs\./.test(bodyText)) {
            responsibilities.push('File I/O');
        }
        if (/validate|Validation|check/.test(bodyText)) {
            responsibilities.push('Validation');
        }

        return responsibilities.length > 0 ? responsibilities : ['General Logic'];
    }

    /**
     * Extract responsibilities using regex (fallback)
     */
    private extractResponsibilitiesRegex(funcContent: string): string[] {
        const responsibilities: string[] = [];

        if (/await.*sendRequest|fetch|axios|http/i.test(funcContent)) {
            responsibilities.push('API Communication');
        }
        if (/parse|JSON\.parse/i.test(funcContent)) {
            responsibilities.push('Response Parsing');
        }
        if (/rateLimit|throttle|wait/i.test(funcContent)) {
            responsibilities.push('Rate Limiting');
        }
        if (/retry|catch.*retry/i.test(funcContent)) {
            responsibilities.push('Retry Logic');
        }
        if (/cache|Cache/i.test(funcContent)) {
            responsibilities.push('Caching');
        }
        if (/setState|update|save/i.test(funcContent)) {
            responsibilities.push('State Management');
        }
        if (/try.*catch|Error/i.test(funcContent)) {
            responsibilities.push('Error Handling');
        }
        if (/format|Format/i.test(funcContent)) {
            responsibilities.push('Formatting');
        }
        if (/readFile|writeFile|fs\./i.test(funcContent)) {
            responsibilities.push('File I/O');
        }

        return responsibilities.length > 0 ? responsibilities : ['General Logic'];
    }

    /**
     * Resolve file path
     */
    private resolveFilePath(filePath: string, codeAnalysis: CodeAnalysis): string | null {
        // Try to find the file in the workspace
        // This is a simplified version - in practice, you'd need the workspace root
        if (fs.existsSync(filePath)) {
            return filePath;
        }

        // Try relative to common locations
        const possiblePaths = [
            filePath,
            path.join(process.cwd(), filePath),
            path.join(process.cwd(), 'src', filePath)
        ];

        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                return possiblePath;
            }
        }

        return null;
    }
}

