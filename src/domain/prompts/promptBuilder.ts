/**
 * Prompt Builder
 * Centralized prompt construction for all LLM analysis tasks
 * Extracted from llmService.ts to eliminate duplication
 */
import { AnalysisContext, ProductPurposeAnalysis } from '../../llmService';
import { CodeAnalysis, FileInfo, FunctionMetadata, TestMapping } from '../../analyzer';
import { EnhancedProductDocumentation, FileSummary, ModuleSummary } from '../../fileDocumentation';
import { FileAccessHelper } from '../../fileAccessHelper';

export interface IPromptBuilder {
    buildArchitecturePrompt(
        context: AnalysisContext,
        codeAnalysis?: CodeAnalysis,
        productDocs?: EnhancedProductDocumentation,
        productPurposeAnalysis?: ProductPurposeAnalysis,
        fileAccessHelper?: FileAccessHelper
    ): string;
    
    buildProductDocsPrompt(context: AnalysisContext): string;
    
    buildProductPurposePrompt(
        productDocs: EnhancedProductDocumentation,
        context: AnalysisContext
    ): string;
    
    buildFileAnalysisPrompt(file: FileInfo, content: string, role: string): string;
    
    buildModuleRollupPrompt(modulePath: string, moduleType: string, files: FileSummary[]): string;
    
    buildProductLevelPrompt(
        fileSummaries: FileSummary[],
        moduleSummaries: ModuleSummary[],
        analysis: CodeAnalysis,
        fileAccessHelper: FileAccessHelper
    ): string;
    
    buildPerFileTestPlanPrompt(
        filePath: string,
        fileContent: string,
        functionMetadata: FunctionMetadata[],
        existingTests: string[],
        language: string,
        testFramework: string,
        projectSummary?: string
    ): string;
    
    buildTestCodeGenerationPrompt(
        testPlanItem: any,
        sourceCode: string,
        functionCode: string,
        language: string,
        testFramework: string
    ): string;
}

export class PromptBuilder implements IPromptBuilder {
    buildArchitecturePrompt(
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

# Your Task: Systematic Architecture Analysis

Follow this structured plan phase approach to analyze the codebase. Work through each step systematically, using the information provided and requesting additional files/searches as needed.

## Plan Phase: Systematic Architecture Discovery

### Step 1: Understand Product Domain & Purpose
First, understand WHAT this product does and WHY it exists:
- Review product documentation, README files, and module descriptions
- Identify the core problem the product solves
- Understand user workflows and use cases
- Note any domain-specific concepts or terminology
- Identify the product's primary value proposition

### Step 2: Map Architectural Layers
Identify and document the architectural layers present in this codebase:
- **Presentation Layer**: UI components, views, templates, webviews, rendering logic
- **Application/Business Logic Layer**: Core business rules, use cases, orchestration
- **Data/Integration Layer**: Data access, external API integration, file I/O, persistence
- **Infrastructure Layer**: Configuration, utilities, cross-cutting concerns
- **Domain Layer** (if applicable): Domain models, entities, value objects

For each layer:
- List which files/directories belong to each layer
- Identify the responsibilities of each layer
- Note any layer boundaries or interfaces between layers

### Step 3: Analyze Dependencies & Data Flow
Map how layers and modules interact:
- Identify dependency direction (which layers depend on which)
- Map data flow through the system (where data originates, how it transforms, where it's consumed)
- Identify circular dependencies or problematic coupling
- Note any dependency inversion or abstraction layers
- Document external dependencies (APIs, libraries, services)

### Step 4: Identify Architectural Patterns
Document the patterns and styles used:
- Architectural style (MVC, MVP, MVVM, Clean Architecture, Layered, etc.)
- Design patterns in use (Factory, Strategy, Observer, etc.)
- Communication patterns (events, callbacks, promises, streams)
- Data patterns (repository, service, gateway, etc.)

### Step 5: Detect Architectural Issues
Based on your understanding from Steps 1-4, identify issues:

**Layer Violations**: Code in the wrong architectural layer
- Presentation logic in business/data layers
- Business logic in presentation layer
- Data access code in presentation layer
- Cross-layer violations

**Dependency Issues**: Problems with how components depend on each other
- Circular dependencies
- High coupling between layers
- Missing abstraction layers
- Direct dependencies on concrete implementations

**Duplicate Functionality**: Multiple ways to accomplish the same task
- Multiple implementations of the same feature
- Redundant code paths for the same operation
- Overlapping responsibilities between modules

**Architectural Inconsistencies**: Patterns that violate the established architecture
- Inconsistent use of patterns
- Mixed architectural styles
- Violations of layer boundaries
- Missing or incorrect abstractions

For EACH issue found, provide:
1. **Title**: Human-readable title describing the issue
2. **Description**: Detailed description including problem AND proposed fix
3. **Relevant Files**: List of file paths affected
4. **Relevant Functions**: List of function/class names involved

Format for description:
[Problem description]. **Proposed Fix**: [Specific, actionable solution with steps or approach. Be detailed and concrete.]

Examples:
- Title: "Business Logic in Presentation Layer"
  Description: "UserService.validateUser() is called directly from UI components in src/ui/login.tsx. Business validation logic should be in the application layer, not invoked from presentation. **Proposed Fix**: Create an ApplicationService layer (src/application/userService.ts) that handles validation. UI components should call application services, not domain services directly. Move validation logic to the application layer and update UI components to use the new service."
  Relevant Files: ["src/ui/login.tsx", "src/services/UserService.ts"]
  Relevant Functions: ["UserService.validateUser", "LoginComponent.handleSubmit"]

- Title: "Circular Dependency Between Layers"
  Description: "Data layer (src/data/repository.ts) imports from application layer (src/application/useCase.ts), while application layer imports from data layer. This creates a circular dependency. **Proposed Fix**: Introduce interfaces in a shared contracts/domain layer. Data layer should implement interfaces defined in domain layer. Application layer should depend on domain interfaces, not concrete data implementations. Create src/domain/interfaces/IRepository.ts and refactor both layers to depend on it."
  Relevant Files: ["src/data/repository.ts", "src/application/useCase.ts"]
  Relevant Functions: ["UserRepository", "CreateUserUseCase"]

- Title: "Duplicate Data Access Patterns"
  Description: "Both src/data/userRepository.ts and src/services/userService.ts implement similar data fetching logic. Repository pattern should handle all data access, with services using repositories. **Proposed Fix**: Consolidate data access in repository layer. Remove data access code from service layer. Services should orchestrate business logic using repositories, not fetch data directly."
  Relevant Files: ["src/data/userRepository.ts", "src/services/userService.ts"]
  Relevant Functions: ["UserRepository.fetch", "UserService.getUser"]

[Continue with more issues, each with title, description, relevantFiles, and relevantFunctions]

# Output Format

Provide your analysis using EXACTLY these markdown section headers. The content will be rendered in VSCode, so use proper markdown syntax:

## Overall Architecture Assessment
Based on your systematic analysis (Steps 1-4), provide a comprehensive assessment:
- Architecture style and patterns identified
- How well the architecture aligns with the product's purpose
- Overall structural quality and maintainability
- Key architectural decisions and their rationale
[Write 2-3 paragraphs here]

## Architectural Layers
Document the layers you identified in Step 2:
- **Presentation Layer**: [List files/directories and responsibilities]
- **Application/Business Logic Layer**: [List files/directories and responsibilities]
- **Data/Integration Layer**: [List files/directories and responsibilities]
- **Infrastructure Layer**: [List files/directories and responsibilities]
- **Domain Layer** (if applicable): [List files/directories and responsibilities]

For each layer, note:
- Which files/directories belong to it
- What responsibilities it has
- Any layer boundaries or interfaces

## Dependencies & Data Flow
Document your findings from Step 3:
- Dependency direction between layers (create a dependency graph if helpful)
- Data flow through the system (where data originates, transforms, is consumed)
- Circular dependencies found (if any)
- Abstraction layers and interfaces
- External dependencies (APIs, libraries, services)

## Architectural Patterns
Document patterns identified in Step 4:
- Architectural style (MVC, MVP, MVVM, Clean Architecture, Layered, etc.)
- Design patterns in use
- Communication patterns
- Data patterns

## Strengths
- Strength 1 (e.g., "Clear separation of concerns between layers")
- Strength 2 (e.g., "Well-defined interfaces between components")
[Continue with more strengths based on your analysis]

## Issues & Concerns
Based on Step 5, list all architectural issues found. Use the format specified in Step 5 above.

## Code Organization
Analyze file structure in the context of the architectural layers you identified:
- Files cluttering the root directory (e.g., many .md files, config files, etc.)
- Missing logical folder structure that aligns with architectural layers
- Files that should be organized into subdirectories matching their layer
- Documentation files that should be in a docs/ folder
- Configuration files that should be organized
- Files in wrong directories relative to their architectural layer
- Any file organization anti-patterns

**Layer Organization Analysis:**
Based on your layer mapping (Step 2), check if files are organized correctly:
- Are presentation layer files in appropriate directories (ui/, views/, components/, etc.)?
- Are business logic files separated from presentation and data layers?
- Are data/integration files in appropriate directories (data/, repositories/, api/, etc.)?
- Are infrastructure files (config, utils) properly separated?
- Do file locations match their architectural layer responsibilities?

[Write your analysis here - at least 2-3 paragraphs, referencing your layer mapping from earlier]

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

## Success/Errors
For EACH major code path, function, or component, document:
1. **What should succeed**: Expected successful behaviors, valid inputs, happy paths
2. **What should fail**: Expected error conditions, invalid inputs, edge cases that should throw errors
3. **Silent failures to watch for**: Cases where code might fail silently (e.g., fallbacks, default values, try-catch that swallows errors)
4. **Fallback behaviors**: Any fallback mechanisms and when they activate

This section helps identify:
- Missing error handling
- Silent failures that need logging
- Fallback logic that might mask problems
- Code paths that should fail but don't
- Error conditions that aren't properly handled

Format for each entry:
- **Component/Function**: [Name]
  - **Success Cases**: [List what should work]
  - **Expected Failures**: [List what should fail and how]
  - **Silent Failures Risk**: [Any cases that might fail silently]
  - **Fallbacks**: [Any fallback mechanisms]

Examples:
- **Component**: User authentication
  - **Success Cases**: Valid credentials return user object, session created
  - **Expected Failures**: Invalid credentials throw AuthenticationError, expired tokens throw TokenExpiredError
  - **Silent Failures Risk**: Network timeout might return null instead of throwing, missing user defaults to guest access
  - **Fallbacks**: On API failure, falls back to cached credentials (risky - should log)

- **Function**: parseConfigFile(path)
  - **Success Cases**: Valid JSON/YAML file returns config object
  - **Expected Failures**: Invalid file format throws ParseError, missing file throws FileNotFoundError
  - **Silent Failures Risk**: Malformed file might return empty object {} instead of error
  - **Fallbacks**: None

[Continue documenting all major code paths, functions, and components]

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

    buildProductDocsPrompt(context: AnalysisContext): string {
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

    buildProductPurposePrompt(
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

    buildFileAnalysisPrompt(file: FileInfo, content: string, role: string): string {
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

    buildModuleRollupPrompt(modulePath: string, moduleType: string, files: FileSummary[]): string {
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

    buildProductLevelPrompt(
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

    // Helper methods
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

    buildPerFileTestPlanPrompt(
        filePath: string,
        fileContent: string,
        functionMetadata: FunctionMetadata[],
        existingTests: string[],
        language: string,
        testFramework: string,
        projectSummary?: string
    ): string {
        // Build symbol table
        const symbolTable = functionMetadata.map(f => ({
            name: f.symbolName,
            parameters: f.parameters.map(p => ({
                name: p.name,
                type: p.type || 'unknown',
                defaultValue: p.defaultValue,
                optional: p.optional
            })),
            returnType: f.returnType || 'unknown',
            visibility: f.visibility,
            docstring: f.docstring || undefined
        }));

        // Build branch summary
        const branchSummary = functionMetadata.map(f => ({
            symbol: f.symbolName,
            branches: f.branches.map(b => ({
                type: b.type,
                condition: b.condition,
                lineNumber: b.lineNumber
            }))
        }));

        // Build dependency profile
        const dependencyProfile = functionMetadata.map(f => ({
            symbol: f.symbolName,
            dependencies: f.dependencies.map(d => ({
                name: d.name,
                type: d.type,
                isInternal: d.isInternal,
                lineNumber: d.lineNumber
            }))
        }));

        // Build existing tests summary
        const existingTestsSummary = existingTests.length > 0 
            ? existingTests.map(test => ({ testFile: test, testNames: [] }))
            : [];

        return `SYSTEM:

You are an automated test planner for a multi-language codebase.

Your job is to analyze a single source file and propose a COMPLETE,
STRUCTURED test plan that a separate tool will later turn into real
test code.

You must:
- Work with ANY programming language (you'll be told which).
- Focus on UNIT tests only (no end-to-end or integration tests).
- Cover the following test categories when appropriate:

  1) happy_path: normal use-cases that succeed
  2) error_path: exceptions, error returns, invalid inputs
  3) boundary_conditions: null/None, empty collections, 0, max/min values
  4) dependency_mocks: behavior when external services/IO are involved
  5) state_mutation: before/after object state changes
  6) algorithmic_branches: different logical branches, cases, and loops
  7) serialization_conversion: JSON/DTO/struct conversion where applicable
  8) regression_lockin: weird or non-obvious behavior the current code exhibits

Your output is a JSON object ONLY, with no explanation text.

Use this schema:

{
  "file_path": "<string>",
  "language": "<string>",
  "test_framework": "<string>",
  "summary": "<1-3 sentence summary of what this file does>",
  "targets": [
    {
      "symbol_name": "<function_or_method_name>",
      "kind": "function | method | class | module",
      "reason_to_test": "<short text>",
      "risk_level": "high | medium | low",
      "dependencies": [
        {
          "name": "<dependency or API>",
          "type": "db | http | filesystem | message_queue | cache | time | random | other",
          "treatment": "mock | stub | real_in_unit_test"
        }
      ],
      "coverage_goals": {
        "branches_to_cover": [
          "<human-readable description of each important branch/condition>"
        ],
        "error_paths_to_cover": [
          "<conditions under which errors/exceptions should occur>"
        ],
        "state_changes_to_verify": [
          "<which fields or globals should be checked before/after>"
        ]
      },
      "planned_tests": [
        {
          "id": "<stable identifier like symbol_name_case_001>",
          "category": "happy_path | error_path | boundary_conditions | dependency_mocks | state_mutation | algorithmic_branches | serialization_conversion | regression_lockin",
          "description": "<1-2 sentence natural-language description of the test scenario>",
          "given": {
            "inputs": "<concise description of inputs/arguments>",
            "preconditions": "<any necessary setup or initial state>",
            "mocks": "<which dependencies are mocked and how they behave>"
          },
          "when": "<what function/method is called and with which key parameters>",
          "then": {
            "assertions": [
              "<expected return value or exception>",
              "<expected object state changes>",
              "<expected interactions with dependencies (e.g., 'repository.save called once with X')>"
            ]
          }
        }
      ]
    }
  ],
  "notes": [
    "<optional global notes about constraints, config, or things that should NOT be tested>"
  ]
}

If something is not applicable (e.g., no serialization), simply omit tests in that category
rather than forcing irrelevant test cases.

Avoid duplicating essentially identical tests; instead, choose a small set of tests that,
together, cover all important behavior and branches in the file.

END SYSTEM

USER:

Here is the project context:

- Language: ${language}
- Preferred unit test framework: ${testFramework}  (if unknown, suggest one but still produce a generic plan)
- Project summary: ${projectSummary || 'N/A'}  (short text, optional)

Here is the static analysis for this file:

- File path: ${filePath}
- Symbol table:

${JSON.stringify(symbolTable, null, 2)}

- Branches per symbol:

${JSON.stringify(branchSummary, null, 2)}

- Dependency profile per symbol:

${JSON.stringify(dependencyProfile, null, 2)}

- Existing tests mapped to this file:

${JSON.stringify(existingTestsSummary, null, 2)}

Now here is the FULL SOURCE CODE of this file:

\`\`\`${language}
${fileContent}
\`\`\`

Using ALL of the above, generate the JSON test plan described in the system message.

Do NOT generate any test code, only the plan.`;
    }

    buildTestCodeGenerationPrompt(
        testPlanItem: any,
        sourceCode: string,
        functionCode: string,
        language: string,
        testFramework: string
    ): string {
        return `Generate executable test code for this test plan item.

Test Plan:
${JSON.stringify(testPlanItem, null, 2)}

Source Function:
\`\`\`${language}
${functionCode}
\`\`\`

Full Source File (for context):
\`\`\`${language}
${sourceCode.substring(0, 2000)}${sourceCode.length > 2000 ? '\n... (truncated)' : ''}
\`\`\`

Requirements:
- Language: ${language}
- Framework: ${testFramework}
- Test ID: ${testPlanItem.id}
- Category: ${testPlanItem.category}
- Return ONLY plain source code text (NO markdown, NO HTML, NO triple backticks)
- Include all imports and setup
- Use proper mocking for dependencies listed in the test plan
- Include all assertions from the plan
- Make the test code complete and immediately runnable
- Follow ${testFramework} best practices for ${language}

The test code should:
1. Set up any necessary mocks based on the "given.mocks" field
2. Arrange test data based on "given.inputs" and "given.preconditions"
3. Execute the function call as described in "when"
4. Assert all expected outcomes from "then.assertions"

Return ONLY the test code, no explanations or markdown formatting.`;
    }
}

