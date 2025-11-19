/**
 * Enhanced Refactoring Prompt Builder
 * Provides detailed, prescriptive refactoring instructions
 */
import { CodeAnalysis, FileInfo, FunctionMetadata } from '../../analyzer';
import { AnalysisContext } from '../../llmService';
import { EnhancedProductDocumentation } from '../../fileDocumentation';
import { LLMInsights } from '../../llmService';

export interface FunctionAnalysis {
    file: string;
    name: string;
    signature: string;
    startLine: number;
    endLine: number;
    lines: number;
    parameters: string[];
    returnType: string;
    isPublic: boolean;
    isAsync: boolean;
    dependencies: string[]; // Functions/classes it calls
    dependents: string[]; // Functions that call it
    responsibilities: string[];
}

export interface ExtractionPlan {
    sourceFile: string;
    targetFile: string;
    functions: Array<{
        name: string;
        lines: [number, number];
        reason: string;
        dependencies: string[];
        dependents: string[];
    }>;
    migrationSteps: string[];
    codeExamples: {
        before: string;
        after: string;
    };
}

export class RefactoringPromptBuilder {
    /**
     * Build enhanced refactoring report prompt with detailed extraction plans
     */
    buildDetailedRefactoringPrompt(
        context: AnalysisContext,
        codeAnalysis: CodeAnalysis,
        productDocs?: EnhancedProductDocumentation,
        architectureInsights?: LLMInsights,
        functionAnalyses?: FunctionAnalysis[]
    ): string {
        let prompt = this.buildBasePrompt(context, codeAnalysis, productDocs, architectureInsights);
        
        // Add detailed function analysis if available
        if (functionAnalyses && functionAnalyses.length > 0) {
            prompt += this.buildFunctionAnalysisSection(functionAnalyses);
        }
        
        // Add detailed extraction requirements
        prompt += this.buildExtractionRequirementsSection();
        
        // Add code example requirements
        prompt += this.buildCodeExampleRequirementsSection();
        
        return prompt;
    }

    private buildBasePrompt(
        context: AnalysisContext,
        codeAnalysis: CodeAnalysis,
        productDocs?: EnhancedProductDocumentation,
        architectureInsights?: LLMInsights
    ): string {
        let prompt = `You are an expert software architect and refactoring specialist. Generate a comprehensive refactoring report that provides ACTIONABLE, STEP-BY-STEP instructions for refactoring large files.

## Codebase Statistics
- Total Files: ${context.totalFiles}
- Total Lines: ${context.totalLines}
- Total Functions: ${context.totalFunctions}
- Large Files (>500 lines): ${context.largeFiles}
- Very Large Files (>1000 lines): ${this.countLargeFiles(context.files)}

## Entry Points
${context.entryPoints.map((ep: { path: string; type: string; reason: string }) => `- ${ep.path} (${ep.type}): ${ep.reason}`).join('\n')}

## Large Files Requiring Decomposition
${this.formatLargeFiles(context.files, codeAnalysis)}

`;

        if (productDocs) {
            prompt += this.buildProductDocsSection(productDocs);
        }

        if (architectureInsights) {
            prompt += this.buildArchitectureInsightsSection(architectureInsights);
        }

        return prompt;
    }

    private buildFunctionAnalysisSection(functionAnalyses: FunctionAnalysis[]): string {
        const largeFiles = this.groupByFile(functionAnalyses);
        
        let section = `\n## Detailed Function Analysis\n\n`;
        
        for (const [file, functions] of Object.entries(largeFiles)) {
            if (functions.length === 0) continue;
            
            section += `### ${file} (${functions.length} functions)\n\n`;
            
            for (const func of functions.slice(0, 20)) { // Limit to top 20 per file
                section += `#### ${func.name}()\n`;
                section += `- **Signature**: \`${func.signature}\`\n`;
                section += `- **Lines**: ${func.startLine}-${func.endLine} (${func.lines} lines)\n`;
                section += `- **Visibility**: ${func.isPublic ? 'public' : 'private'}\n`;
                section += `- **Async**: ${func.isAsync ? 'yes' : 'no'}\n`;
                section += `- **Responsibilities**: ${func.responsibilities.join(', ')}\n`;
                
                if (func.dependencies.length > 0) {
                    section += `- **Dependencies** (calls): ${func.dependencies.slice(0, 10).join(', ')}${func.dependencies.length > 10 ? '...' : ''}\n`;
                }
                
                if (func.dependents.length > 0) {
                    section += `- **Dependents** (called by): ${func.dependents.slice(0, 10).join(', ')}${func.dependents.length > 10 ? '...' : ''}\n`;
                }
                
                section += '\n';
            }
        }
        
        return section;
    }

    private buildExtractionRequirementsSection(): string {
        return `
## CRITICAL: Detailed Extraction Plans Required

For EACH file over 1000 lines, you MUST provide a detailed extraction plan with the following structure:

### File: [file-path]

#### 1. Function Inventory
List ALL functions in the file with:
- Function name and signature
- Line numbers (start-end)
- Responsibilities (what it does)
- Dependencies (what it calls)
- Dependents (what calls it)
- Complexity indicators (nested loops, conditionals, etc.)

#### 2. Responsibility Analysis
Group functions by responsibility:
- **API Communication**: [list functions]
- **Response Parsing**: [list functions]
- **Rate Limiting**: [list functions]
- **Retry Logic**: [list functions]
- **Caching**: [list functions]
- **State Management**: [list functions]
- **Error Handling**: [list functions]
- **Formatting**: [list functions]

#### 3. Extraction Mapping
For EACH group of functions to extract:

**Extract to**: \`[target-file-path]\`

**Functions to Extract**:
- \`functionName1()\` (lines X-Y): [reason for extraction]
- \`functionName2()\` (lines X-Y): [reason for extraction]

**Dependencies to Move**:
- [List functions that must move with the extracted functions]

**Dependencies to Inject**:
- [List dependencies to pass as constructor parameters or method parameters]

**Breaking Changes**:
- [List what will break]
- [How to fix each breaking change]

#### 4. Step-by-Step Migration Instructions

For EACH extraction, provide numbered steps:

**Step 1: Create Target File**
- Create file \`[target-file-path]\`
- Define interface/class structure:
\`\`\`typescript
// Show the interface/class definition
\`\`\`
- Add necessary imports

**Step 2: Extract Functions**
- Copy function code from source file
- Update imports in extracted code
- Handle dependencies (inject or move)
- Show the extracted code:
\`\`\`typescript
// Show extracted function code
\`\`\`

**Step 3: Update Source File**
- Remove extracted functions
- Add import from target file
- Update call sites within source file
- Show updated code:
\`\`\`typescript
// Show updated source file code
\`\`\`

**Step 4: Update Dependent Files**
For EACH file that uses the extracted functions:
- File: \`[dependent-file-path]\`
- Change: [exact change needed]
- Before:
\`\`\`typescript
// Show current code
\`\`\`
- After:
\`\`\`typescript
// Show updated code
\`\`\`

**Step 5: Handle Dependencies**
- [List shared dependencies]
- [How to resolve them (inject, extract, etc.)]

**Step 6: Testing**
- [What tests need updating]
- [How to verify extraction worked]
- [Regression test checklist]

#### 5. Dependency Resolution Strategy

For EACH circular dependency or shared state issue:
- **Problem**: [Description]
- **Current State**: [How it's currently handled]
- **Solution**: [How to resolve it]
- **Implementation**: [Step-by-step fix]

#### 6. Migration Order

Provide the order in which extractions should be done:
1. [First extraction] - Reason: [why first]
2. [Second extraction] - Reason: [why second]
3. [etc.]

**Rationale**: [Why this order minimizes risk and breaking changes]

#### 7. Rollback Plan

For EACH extraction:
- **Checkpoint**: [What to commit before starting]
- **Rollback Steps**: [How to revert if something goes wrong]
- **Verification**: [How to verify extraction succeeded before proceeding]

`;
    }

    private buildCodeExampleRequirementsSection(): string {
        return `
## Code Example Requirements

For EACH major refactoring (>200 lines affected), provide:

### Before/After Code Examples

**Before (Current Code)**:
\`\`\`typescript
// Show current code structure
// Include relevant context (class definition, imports, etc.)
// Highlight what will be extracted
\`\`\`

**After (Refactored Code)**:
\`\`\`typescript
// Show new code structure
// Show both source file (after extraction) and target file (extracted code)
// Highlight improvements
\`\`\`

**Key Changes**:
- [List specific changes made]
- [Why each change improves the code]
- [How it reduces complexity]

### Interface Definitions

For EACH new service/class created, show:
\`\`\`typescript
// Complete interface/class definition
// Include all methods, properties, dependencies
\`\`\`

### Usage Examples

Show how to use the refactored code:
\`\`\`typescript
// Example usage
// Show before and after usage patterns
\`\`\`

`;
    }

    private buildProductDocsSection(productDocs: EnhancedProductDocumentation): string {
        return `
## Product Context

### Overview
${productDocs.overview || 'N/A'}

### Architecture
${productDocs.architecture || 'N/A'}

### Key Modules
${productDocs.modules?.map(m => `- ${m.module} (${m.moduleType}): ${m.summary || 'N/A'}`).join('\n') || 'N/A'}

### Architectural Patterns to Follow
${this.extractArchitecturalPatterns(productDocs)}

`;
    }

    private buildArchitectureInsightsSection(insights: LLMInsights): string {
        return `
## Architecture Assessment

### Overall Assessment
${insights.overallAssessment || 'N/A'}

### Critical Issues
${insights.issues?.slice(0, 10).map(i => {
    if (typeof i === 'string') return `- ${i}`;
    return `- **${i.title}**: ${i.description}`;
}).join('\n') || 'N/A'}

### Recommendations
${insights.recommendations?.slice(0, 10).map(r => {
    if (typeof r === 'string') return `- ${r}`;
    return `- **${r.title}**: ${r.description}`;
}).join('\n') || 'N/A'}

### Refactoring Priorities
${insights.priorities?.slice(0, 10).map(p => {
    if (typeof p === 'string') return `- ${p}`;
    return `- **${p.title}**: ${p.description}`;
}).join('\n') || 'N/A'}

`;
    }

    private formatLargeFiles(files: FileInfo[], codeAnalysis?: CodeAnalysis): string {
        const largeFiles = files
            .filter(f => f.lines > 500)
            .sort((a, b) => b.lines - a.lines)
            .slice(0, 20);

        return largeFiles.map((f, i) => {
            const fileFunctions = codeAnalysis?.functions.filter(func => func.file === f.path) || [];
            const funcList = fileFunctions.length > 0
                ? fileFunctions.slice(0, 10).map(func => 
                    `    - ${func.name} (${func.startLine}-${func.endLine}, ${func.lines} lines)`
                ).join('\n')
                : '    - (no functions detected)';
            
            return `${i + 1}. **${f.path}** (${f.lines} lines, ${f.functions} functions)
${funcList}`;
        }).join('\n\n');
    }

    private countLargeFiles(files: FileInfo[]): number {
        return files.filter(f => f.lines > 1000).length;
    }

    private groupByFile(functionAnalyses: FunctionAnalysis[]): Record<string, FunctionAnalysis[]> {
        const grouped: Record<string, FunctionAnalysis[]> = {};
        for (const func of functionAnalyses) {
            if (!grouped[func.file]) {
                grouped[func.file] = [];
            }
            grouped[func.file].push(func);
        }
        return grouped;
    }

    private extractArchitecturalPatterns(productDocs: EnhancedProductDocumentation): string {
        // Extract patterns from architecture description
        const patterns: string[] = [];
        
        if (productDocs.architecture) {
            const arch = productDocs.architecture.toLowerCase();
            if (arch.includes('layered')) patterns.push('Layered Architecture');
            if (arch.includes('clean')) patterns.push('Clean Architecture');
            if (arch.includes('domain-driven')) patterns.push('Domain-Driven Design');
            if (arch.includes('mvc')) patterns.push('MVC');
            if (arch.includes('mvp')) patterns.push('MVP');
        }
        
        return patterns.length > 0 
            ? patterns.map(p => `- ${p}`).join('\n')
            : '- (patterns not explicitly identified)';
    }
}

