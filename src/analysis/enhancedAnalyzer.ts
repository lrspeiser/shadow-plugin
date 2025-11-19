/**
 * Enhanced Analyzer with AST parsing for detailed code analysis
 * Extends basic CodeAnalyzer with branch analysis, dependency profiling, and behavioral hints
 */
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {
    CodeAnalysis,
    FunctionMetadata,
    BranchInfo,
    DependencyInfo,
    StateMutationInfo,
    TestMapping,
    BehavioralHints,
    FunctionInfo
} from '../analyzer';

export class EnhancedAnalyzer {
    /**
     * Analyze a single file and extract enhanced metadata for all functions
     */
    async analyzeFileMetadata(
        filePath: string,
        content: string,
        language: string,
        functions: FunctionInfo[]
    ): Promise<Map<string, FunctionMetadata>> {
        const metadata = new Map<string, FunctionMetadata>();

        for (const func of functions) {
            if (func.file !== path.basename(filePath) && func.file !== filePath) {
                continue;
            }

            const functionContent = this.extractFunctionContent(content, func.startLine, func.endLine);
            
            let funcMetadata: FunctionMetadata;
            
            if (language === 'typescript' || language === 'javascript') {
                funcMetadata = await this.analyzeTypeScriptFunction(
                    filePath,
                    content,
                    func,
                    functionContent
                );
            } else {
                // Fallback to regex-based analysis for other languages
                funcMetadata = this.analyzeFunctionWithRegex(
                    filePath,
                    func,
                    functionContent,
                    language
                );
            }

            metadata.set(func.name, funcMetadata);
        }

        return metadata;
    }

    /**
     * Analyze TypeScript/JavaScript function using AST
     */
    private async analyzeTypeScriptFunction(
        filePath: string,
        fullContent: string,
        func: FunctionInfo,
        functionContent: string
    ): Promise<FunctionMetadata> {
        try {
            const sourceFile = ts.createSourceFile(
                filePath,
                fullContent,
                ts.ScriptTarget.Latest,
                true
            );

            // Find the function node in AST
            const functionNode = this.findFunctionNode(sourceFile, func.name, func.startLine);
            
            if (functionNode) {
                return this.extractMetadataFromAST(functionNode, func, filePath, sourceFile);
            }
        } catch (error) {
            // Fallback to regex if AST parsing fails
            console.warn(`AST parsing failed for ${func.name}, using regex fallback:`, error);
        }

        return this.analyzeFunctionWithRegex(filePath, func, functionContent, 'typescript');
    }

    /**
     * Find function node in AST by name and line number
     */
    private findFunctionNode(
        sourceFile: ts.SourceFile,
        functionName: string,
        startLine: number
    ): ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression | null {
        let found: ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression | null = null;

        const visit = (node: ts.Node) => {
            const nodeLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            
            if (
                (ts.isFunctionDeclaration(node) ||
                 ts.isMethodDeclaration(node) ||
                 ts.isFunctionExpression(node) ||
                 ts.isArrowFunction(node)) &&
                nodeLine === startLine
            ) {
                const name = this.getFunctionName(node);
                if (name === functionName || nodeLine === startLine) {
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
     * Get function name from node
     */
    private getFunctionName(node: ts.Node): string {
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
            return node.name?.getText() || '';
        }
        if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
            const parent = node.parent;
            if (ts.isVariableDeclaration(parent)) {
                return parent.name.getText();
            }
            if (ts.isPropertyAssignment(parent)) {
                return parent.name.getText();
            }
        }
        return '';
    }

    /**
     * Extract metadata from AST node
     */
    private extractMetadataFromAST(
        node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression,
        func: FunctionInfo,
        filePath: string,
        sourceFile: ts.SourceFile
    ): FunctionMetadata {
        const parameters: FunctionMetadata['parameters'] = [];
        let returnType: string | undefined;
        let visibility: 'public' | 'private' | 'protected' = 'public';
        const branches: BranchInfo[] = [];
        const dependencies: DependencyInfo[] = [];
        const stateMutations: StateMutationInfo[] = [];

        // Extract parameters
        if (node.parameters) {
            for (const param of node.parameters) {
                const paramName = param.name.getText();
                const paramType = param.type?.getText();
                const isOptional = !!param.questionToken || !!param.initializer;
                const defaultValue = param.initializer?.getText();

                parameters.push({
                    name: paramName,
                    type: paramType,
                    defaultValue,
                    optional: isOptional
                });
            }
        }

        // Extract return type
        if ('type' in node && node.type) {
            returnType = node.type.getText();
        }

        // Extract visibility (for methods)
        if (ts.isMethodDeclaration(node)) {
            if (node.modifiers) {
                if (node.modifiers.some(m => m.kind === ts.SyntaxKind.PrivateKeyword)) {
                    visibility = 'private';
                } else if (node.modifiers.some(m => m.kind === ts.SyntaxKind.ProtectedKeyword)) {
                    visibility = 'protected';
                }
            }
        }

        // Extract branches and dependencies from function body
        if (node.body) {
            this.analyzeNode(node.body, sourceFile, branches, dependencies, stateMutations);
        }

        // Extract docstring (JSDoc comment)
        const docstring = this.extractDocstring(node, sourceFile);

        // Determine risk level
        const riskLevel = this.calculateRiskLevel(branches, dependencies, stateMutations);

        return {
            symbolName: func.name,
            file: filePath,
            parameters,
            returnType,
            visibility,
            docstring,
            branches,
            dependencies,
            stateMutations,
            riskLevel,
            startLine: func.startLine,
            endLine: func.endLine
        };
    }

    /**
     * Recursively analyze AST node for branches, dependencies, and mutations
     */
    private analyzeNode(
        node: ts.Node,
        sourceFile: ts.SourceFile,
        branches: BranchInfo[],
        dependencies: DependencyInfo[],
        stateMutations: StateMutationInfo[]
    ): void {
        const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

        // Detect branches
        if (ts.isIfStatement(node)) {
            const condition = node.expression.getText();
            branches.push({
                type: 'if',
                condition: `if (${condition})`,
                lineNumber
            });
        } else if (ts.isSwitchStatement(node)) {
            branches.push({
                type: 'switch',
                condition: `switch (${node.expression.getText()})`,
                lineNumber
            });
        } else if (ts.isCaseClause(node) || ts.isDefaultClause(node)) {
            const condition = ts.isCaseClause(node) ? `case ${node.expression?.getText()}` : 'default';
            branches.push({
                type: 'case',
                condition,
                lineNumber
            });
        } else if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node) || ts.isWhileStatement(node)) {
            const condition = node.condition?.getText() || 'true';
            branches.push({
                type: 'loop',
                condition: `loop (${condition})`,
                lineNumber
            });
        } else if (ts.isTryStatement(node)) {
            branches.push({
                type: 'try',
                condition: 'try block',
                lineNumber
            });
        } else if (ts.isCatchClause(node)) {
            branches.push({
                type: 'catch',
                condition: `catch (${node.variableDeclaration?.name.getText() || 'error'})`,
                lineNumber
            });
        } else if (ts.isThrowStatement(node)) {
            branches.push({
                type: 'exception',
                condition: `throw ${node.expression.getText()}`,
                lineNumber
            });
        }

        // Detect dependencies
        if (ts.isCallExpression(node)) {
            const dep = this.analyzeCallExpression(node, sourceFile);
            if (dep) {
                dependencies.push(dep);
            }
        }

        // Detect state mutations
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            const target = node.left.getText();
            stateMutations.push({
                target,
                mutationType: 'assign',
                lineNumber
            });
        } else if (ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node)) {
            const target = node.operand.getText();
            stateMutations.push({
                target,
                mutationType: 'modify',
                lineNumber
            });
        }

        // Recurse into children
        ts.forEachChild(node, (child) => {
            this.analyzeNode(child, sourceFile, branches, dependencies, stateMutations);
        });
    }

    /**
     * Analyze call expression to determine dependency type
     */
    private analyzeCallExpression(
        node: ts.CallExpression,
        sourceFile: ts.SourceFile
    ): DependencyInfo | null {
        const expression = node.expression.getText();
        const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

        // Database patterns
        if (expression.match(/\b(db|database|sql|orm|repository|query|execute|save|find|get|create|update|delete)\b/i)) {
            return {
                name: expression,
                type: 'db',
                isInternal: false,
                lineNumber
            };
        }

        // HTTP patterns
        if (expression.match(/\b(fetch|http|axios|request|get|post|put|delete|patch)\b/i)) {
            return {
                name: expression,
                type: 'http',
                isInternal: false,
                lineNumber
            };
        }

        // Filesystem patterns
        if (expression.match(/\b(fs|readFile|writeFile|readdir|mkdir|unlink|stat|exists)\b/i)) {
            return {
                name: expression,
                type: 'filesystem',
                isInternal: false,
                lineNumber
            };
        }

        // Cache patterns
        if (expression.match(/\b(cache|get|set|has|delete)\b/i)) {
            return {
                name: expression,
                type: 'cache',
                isInternal: false,
                lineNumber
            };
        }

        // Time patterns
        if (expression.match(/\b(Date|setTimeout|setInterval|now|getTime)\b/i)) {
            return {
                name: expression,
                type: 'time',
                isInternal: false,
                lineNumber
            };
        }

        // Random patterns
        if (expression.match(/\b(Math\.random|random|uuid|guid)\b/i)) {
            return {
                name: expression,
                type: 'random',
                isInternal: false,
                lineNumber
            };
        }

        // Internal function calls (simple heuristic: no dot notation or known external patterns)
        if (!expression.includes('.') && !expression.match(/^(fetch|http|axios|fs|db|database)/i)) {
            return {
                name: expression,
                type: 'internal',
                isInternal: true,
                lineNumber
            };
        }

        return {
            name: expression,
            type: 'other',
            isInternal: false,
            lineNumber
        };
    }

    /**
     * Extract docstring/JSDoc comment
     */
    private extractDocstring(
        node: ts.Node,
        sourceFile: ts.SourceFile
    ): string | undefined {
        const fullText = sourceFile.getFullText();
        const nodeStart = node.getFullStart();
        const nodeTextStart = node.getStart();
        
        // Get text before node
        const beforeText = fullText.substring(nodeStart, nodeTextStart);
        
        // Look for JSDoc comment
        const jsDocMatch = beforeText.match(/\/\*\*[\s\S]*?\*\//);
        if (jsDocMatch) {
            return jsDocMatch[0]
                .replace(/\/\*\*/g, '')
                .replace(/\*\//g, '')
                .replace(/^\s*\*/gm, '')
                .trim();
        }

        return undefined;
    }

    /**
     * Calculate risk level based on complexity
     */
    private calculateRiskLevel(
        branches: BranchInfo[],
        dependencies: DependencyInfo[],
        stateMutations: StateMutationInfo[]
    ): 'high' | 'medium' | 'low' {
        const branchCount = branches.length;
        const externalDepCount = dependencies.filter(d => !d.isInternal).length;
        const mutationCount = stateMutations.length;

        if (branchCount > 10 || externalDepCount > 5 || mutationCount > 10) {
            return 'high';
        }
        if (branchCount > 5 || externalDepCount > 2 || mutationCount > 5) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Fallback: Analyze function using regex (for non-TypeScript languages or when AST fails)
     */
    private analyzeFunctionWithRegex(
        filePath: string,
        func: FunctionInfo,
        functionContent: string,
        language: string
    ): FunctionMetadata {
        const branches: BranchInfo[] = [];
        const dependencies: DependencyInfo[] = [];
        const stateMutations: StateMutationInfo[] = [];
        const lines = functionContent.split('\n');

        // Extract branches with regex
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = func.startLine + i;

            // If statements
            if (line.match(/\bif\s*\(/)) {
                const match = line.match(/if\s*\(([^)]+)\)/);
                branches.push({
                    type: 'if',
                    condition: match ? `if (${match[1]})` : 'if condition',
                    lineNumber
                });
            }

            // Else/elif
            if (line.match(/\belse\b/)) {
                branches.push({
                    type: 'else',
                    condition: 'else',
                    lineNumber
                });
            }

            // Loops
            if (line.match(/\b(for|while|do)\s*\(/)) {
                const match = line.match(/(for|while|do)\s*\(([^)]*)\)/);
                branches.push({
                    type: 'loop',
                    condition: match ? `${match[1]} (${match[2]})` : 'loop',
                    lineNumber
                });
            }

            // Exceptions
            if (line.match(/\b(throw|raise)\b/)) {
                branches.push({
                    type: 'exception',
                    condition: 'exception thrown',
                    lineNumber
                });
            }

            // Try/catch
            if (line.match(/\btry\s*{/)) {
                branches.push({
                    type: 'try',
                    condition: 'try block',
                    lineNumber
                });
            }
            if (line.match(/\bcatch\s*\(/)) {
                branches.push({
                    type: 'catch',
                    condition: 'catch block',
                    lineNumber
                });
            }

            // Dependencies
            if (line.match(/\b(db|database|sql|orm|repository)\./i)) {
                dependencies.push({
                    name: 'database',
                    type: 'db',
                    isInternal: false,
                    lineNumber
                });
            }
            if (line.match(/\b(fetch|http|axios|request)\./i)) {
                dependencies.push({
                    name: 'http',
                    type: 'http',
                    isInternal: false,
                    lineNumber
                });
            }
            if (line.match(/\b(fs|readFile|writeFile)\./i)) {
                dependencies.push({
                    name: 'filesystem',
                    type: 'filesystem',
                    isInternal: false,
                    lineNumber
                });
            }

            // State mutations
            if (line.match(/^\s*\w+\s*=\s*/)) {
                const match = line.match(/^\s*(\w+)\s*=/);
                if (match) {
                    stateMutations.push({
                        target: match[1],
                        mutationType: 'assign',
                        lineNumber
                    });
                }
            }
        }

        // Extract parameters (simple regex)
        const parameters: FunctionMetadata['parameters'] = [];
        const paramMatch = functionContent.match(/\(([^)]*)\)/);
        if (paramMatch && paramMatch[1]) {
            const params = paramMatch[1].split(',').map(p => p.trim()).filter(p => p);
            for (const param of params) {
                const parts = param.split(/[=:]/).map(p => p.trim());
                parameters.push({
                    name: parts[0],
                    type: parts.length > 2 ? parts[1] : undefined,
                    defaultValue: parts.length > 1 && parts[parts.length - 1] !== parts[0] ? parts[parts.length - 1] : undefined,
                    optional: param.includes('?') || param.includes('=')
                });
            }
        }

        const riskLevel = this.calculateRiskLevel(branches, dependencies, stateMutations);

        return {
            symbolName: func.name,
            file: filePath,
            parameters,
            returnType: undefined,
            visibility: 'public',
            docstring: undefined,
            branches,
            dependencies,
            stateMutations,
            riskLevel,
            startLine: func.startLine,
            endLine: func.endLine
        };
    }

    /**
     * Extract function content from full file content
     */
    private extractFunctionContent(content: string, startLine: number, endLine: number): string {
        const lines = content.split('\n');
        return lines.slice(startLine - 1, endLine).join('\n');
    }

    /**
     * Extract behavioral hints from docstring
     */
    extractBehavioralHints(docstring?: string): BehavioralHints {
        if (!docstring) {
            return {};
        }

        const hints: BehavioralHints = {
            constraints: [],
            errorConditions: [],
            invariants: []
        };

        // Extract constraints (e.g., "must be positive", "required")
        const constraintPatterns = [
            /must\s+be\s+(\w+)/gi,
            /required/gi,
            /cannot\s+be\s+(\w+)/gi,
            /should\s+be\s+(\w+)/gi
        ];

        for (const pattern of constraintPatterns) {
            const matches = docstring.match(pattern);
            if (matches) {
                hints.constraints?.push(...matches);
            }
        }

        // Extract error conditions
        const errorPatterns = [
            /throws?\s+(\w+)/gi,
            /error\s+if/gi,
            /fails?\s+if/gi,
            /exception/gi
        ];

        for (const pattern of errorPatterns) {
            const matches = docstring.match(pattern);
            if (matches) {
                hints.errorConditions?.push(...matches);
            }
        }

        // Extract intended behavior (first sentence or paragraph)
        const sentences = docstring.split(/[.!?]\s+/);
        if (sentences.length > 0) {
            hints.intendedBehavior = sentences[0];
        }

        return hints;
    }

    /**
     * Map existing tests to source files and functions
     */
    async mapExistingTests(workspaceRoot: string, sourceFiles: string[]): Promise<TestMapping> {
        const mapping: TestMapping = {
            sourceFileToTests: new Map(),
            functionToTests: new Map(),
            uncoveredFunctions: [],
            uncoveredBranches: new Map()
        };

        const testFiles = this.findTestFiles(workspaceRoot);

        for (const testFile of testFiles) {
            try {
                const content = fs.readFileSync(testFile, 'utf-8');
                const sourceFile = this.inferSourceFile(testFile, content, sourceFiles);
                const testNames = this.extractTestNames(content);

                if (sourceFile) {
                    if (!mapping.sourceFileToTests.has(sourceFile)) {
                        mapping.sourceFileToTests.set(sourceFile, []);
                    }
                    mapping.sourceFileToTests.get(sourceFile)!.push(testFile);

                    // Map test names to functions (heuristic)
                    for (const testName of testNames) {
                        const functionName = this.inferFunctionFromTestName(testName);
                        if (functionName) {
                            if (!mapping.functionToTests.has(functionName)) {
                                mapping.functionToTests.set(functionName, []);
                            }
                            mapping.functionToTests.get(functionName)!.push(testName);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error mapping test file ${testFile}:`, error);
            }
        }

        return mapping;
    }

    /**
     * Find test files in workspace
     */
    private findTestFiles(workspaceRoot: string): string[] {
        const testFiles: string[] = [];
        const testPatterns = [
            '**/*.test.ts',
            '**/*.test.js',
            '**/*.spec.ts',
            '**/*.spec.js',
            '**/test_*.py',
            '**/*_test.py',
            '**/test/**/*.ts',
            '**/test/**/*.js',
            '**/tests/**/*.ts',
            '**/tests/**/*.js',
            '**/__tests__/**/*.ts',
            '**/__tests__/**/*.js'
        ];

        const traverse = (dir: string) => {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory()) {
                        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                            traverse(fullPath);
                        }
                    } else if (entry.isFile()) {
                        const fileName = entry.name.toLowerCase();
                        if (
                            fileName.includes('test') ||
                            fileName.includes('spec') ||
                            fileName.endsWith('.test.ts') ||
                            fileName.endsWith('.test.js') ||
                            fileName.endsWith('.spec.ts') ||
                            fileName.endsWith('.spec.js')
                        ) {
                            testFiles.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        traverse(workspaceRoot);
        return testFiles;
    }

    /**
     * Infer source file from test file path and content
     */
    private inferSourceFile(
        testFile: string,
        content: string,
        sourceFiles: string[]
    ): string | null {
        const testPath = path.relative(process.cwd(), testFile);
        
        // Try to find corresponding source file
        // Pattern: test_file.ts -> file.ts, file.test.ts -> file.ts
        const baseName = path.basename(testFile, path.extname(testFile))
            .replace(/\.test$/, '')
            .replace(/\.spec$/, '')
            .replace(/^test_/, '');

        // Check imports in test file
        const importMatch = content.match(/from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
            const importPath = importMatch[1];
            for (const sourceFile of sourceFiles) {
                if (sourceFile.includes(importPath) || importPath.includes(path.basename(sourceFile, path.extname(sourceFile)))) {
                    return sourceFile;
                }
            }
        }

        // Try to match by base name
        for (const sourceFile of sourceFiles) {
            const sourceBaseName = path.basename(sourceFile, path.extname(sourceFile));
            if (sourceBaseName === baseName) {
                return sourceFile;
            }
        }

        return null;
    }

    /**
     * Extract test names from test file content
     */
    private extractTestNames(content: string): string[] {
        const testNames: string[] = [];
        
        // Jest/Vitest patterns: test('name', ...) or it('name', ...)
        const jestPattern = /(?:test|it|describe)\(['"]([^'"]+)['"]/g;
        let match;
        while ((match = jestPattern.exec(content)) !== null) {
            testNames.push(match[1]);
        }

        // Mocha patterns: it('name', ...)
        const mochaPattern = /it\(['"]([^'"]+)['"]/g;
        while ((match = mochaPattern.exec(content)) !== null) {
            testNames.push(match[1]);
        }

        // Python pytest patterns: def test_name(...)
        const pytestPattern = /def\s+(test_\w+)/g;
        while ((match = pytestPattern.exec(content)) !== null) {
            testNames.push(match[1]);
        }

        return testNames;
    }

    /**
     * Infer function name from test name (heuristic)
     */
    private inferFunctionFromTestName(testName: string): string | null {
        // Patterns: test_functionName, testFunctionName, test_function_name
        const patterns = [
            /test[_-]?(\w+)/i,
            /should[_-]?(\w+)/i,
            /when[_-]?(\w+)/i
        ];

        for (const pattern of patterns) {
            const match = testName.match(pattern);
            if (match && match[1]) {
                // Convert snake_case or kebab-case to camelCase
                const functionName = match[1]
                    .split(/[-_]/)
                    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
                    .join('');
                return functionName;
            }
        }

        return null;
    }
}

