# Shadow Watch VSCode Plugin - Design Document

## Overview

This VSCode plugin brings Shadow Watch's powerful code architecture analysis directly into your IDE as a continuous monitoring tool. It analyzes your codebase in real-time and generates actionable warnings and suggestions that can be pasted directly into any LLM prompt (Cursor, GitHub Copilot, ChatGPT, etc.).

## Key Features

### 1. **Continuous Monitoring**
- File watcher that triggers analysis on save
- Configurable throttling to avoid overwhelming analysis
- Background worker that doesn't block editing
- Smart caching to only re-analyze changed files

### 2. **Real-Time Insights**
- Architecture problems panel showing live warnings
- Severity levels: Error, Warning, Info
- Click-to-navigate to problematic code locations
- Quick actions for common fixes

### 3. **LLM-Ready Prompts**
- One-click copy of formatted insights for LLM consumption
- Context-aware prompts that include relevant code snippets
- Pre-formatted for different LLMs (Cursor, ChatGPT, etc.)
- Smart context inclusion (only what's needed)

### 4. **Multi-Language Support**
Supports same languages as Shadow Watch:
- Python, JavaScript, TypeScript, Go, Rust, Java, C/C++, Ruby, PHP

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VSCode Extension                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ File Watcher │───▶│   Analyzer   │───▶│  Formatter   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Throttler  │    │    Cache     │    │  Diagnostics │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                   │          │
│                                                   ▼          │
│                                          ┌──────────────┐   │
│                                          │  Tree View   │   │
│                                          └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. File Watcher (`fileWatcher.ts`)
- Monitors workspace for file changes
- Filters relevant file types
- Debounces rapid changes
- Triggers incremental analysis

### 2. Code Analyzer (`analyzer.ts`)
Reuses Shadow Watch's core analysis logic:
- **Structure Analysis**: Lines, functions, imports
- **Dependency Graph**: File relationships, orphaned files
- **Complexity Detection**: Large files, deep nesting
- **Duplicate Detection**: Similar code blocks
- **Anti-Pattern Detection**: Common code smells

### 3. Insight Generator (`insightGenerator.ts`)
Generates actionable insights from analysis:
- Circular dependency warnings
- God object detection
- Dead code identification
- Refactoring opportunities
- Architecture violations

### 4. LLM Formatter (`llmFormatter.ts`)
Formats insights for different LLM contexts:
- **Cursor Format**: Includes file references and line numbers
- **ChatGPT Format**: More verbose with context
- **Generic Format**: Markdown with code snippets
- **Compact Format**: Brief bullet points

### 5. Diagnostics Provider (`diagnosticsProvider.ts`)
Integrates with VSCode's problem panel:
- Shows warnings inline in code
- Squiggly underlines for issues
- Quick fix suggestions
- Code actions

### 6. Tree View (`insightsTreeView.ts`)
Custom sidebar panel showing:
- Architecture health score
- Categorized issues (by severity)
- One-click navigation to problems
- Bulk copy for LLM prompts

## User Workflow

### Passive Monitoring
1. User edits code
2. Plugin analyzes on save
3. Issues appear in Problems panel
4. Tree view updates with insights

### Active LLM Integration
1. User notices warnings/suggestions
2. Clicks "Copy for LLM" button
3. Pre-formatted prompt copied to clipboard
4. User pastes into Cursor/ChatGPT/etc.
5. LLM provides specific fix recommendations

## Configuration Options

```json
{
  "shadowWatch.enabled": true,
  "shadowWatch.analyzeOnSave": true,
  "shadowWatch.analyzeInterval": 30000,
  "shadowWatch.minFilesForAnalysis": 3,
  "shadowWatch.maxFileSizeKB": 500,
  "shadowWatch.excludePatterns": ["**/node_modules/**", "**/.git/**"],
  "shadowWatch.llmFormat": "cursor",
  "shadowWatch.severityThreshold": "warning",
  "shadowWatch.autoAnalyzeWorkspace": true,
  "shadowWatch.showInlineHints": true
}
```

## Data Storage

### Local Cache
- Analysis results stored in `.shadowwatch/` directory
- JSON format for easy inspection
- Incremental updates to reduce overhead
- Can be gitignored

### Workspace State
- Last analysis timestamp
- User-dismissed warnings
- Custom rules/exceptions

## Commands

- `shadowWatch.analyze`: Manually trigger full analysis
- `shadowWatch.analyzeFile`: Analyze current file only
- `shadowWatch.copyInsights`: Copy all insights for LLM
- `shadowWatch.copyFileInsights`: Copy current file insights
- `shadowWatch.clearCache`: Clear analysis cache
- `shadowWatch.showInsights`: Show insights panel
- `shadowWatch.configure`: Open settings

## Extension Points

### Custom Rules
Users can define custom architecture rules:
```typescript
interface ArchitectureRule {
  id: string;
  name: string;
  severity: 'error' | 'warning' | 'info';
  check: (analysis: CodeAnalysis) => Issue[];
}
```

### LLM Formatters
Users can add custom formatters:
```typescript
interface LLMFormatter {
  name: string;
  format: (insights: Insight[]) => string;
}
```

## Privacy & Performance

### Privacy
- All analysis happens locally
- No code sent to external services
- Optional: LLM integration for enhanced insights (requires API key)

### Performance
- Incremental analysis for large codebases
- Web worker for heavy computation
- Smart caching to minimize overhead
- Configurable throttling

## Future Enhancements

1. **AI-Powered Insights** (Optional)
   - Use local LLM or API for deeper analysis
   - Contextual refactoring suggestions
   - Architecture pattern recognition

2. **Team Collaboration**
   - Share architecture rules
   - Export/import configurations
   - Team dashboards

3. **CI/CD Integration**
   - GitHub Action for PR checks
   - Quality gates
   - Architecture drift detection

4. **IDE Integrations**
   - JetBrains plugin
   - Vim/Neovim plugin
   - Sublime Text plugin

## Installation

### From VSIX
```bash
code --install-extension shadow-watch-1.0.0.vsix
```

### From Marketplace
1. Open VSCode
2. Go to Extensions
3. Search "Shadow Watch"
4. Click Install

## Development

```bash
cd vscode-plugin
npm install
npm run watch  # Development mode
npm run compile  # Production build
npm run package  # Create VSIX
```

## Testing

```bash
npm run test  # Unit tests
npm run test:integration  # Integration tests
```

## License

Same as Shadow Watch main project.

