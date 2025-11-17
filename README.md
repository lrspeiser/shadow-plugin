# Shadow Watch - VSCode Architecture Monitor

Continuous code architecture analysis that generates LLM-ready insights for Cursor, ChatGPT, and other AI assistants.

## Features

🔍 **Continuous Monitoring**
- Analyzes your code on every save
- Real-time architecture insights
- Smart caching for performance

⚠️ **Architecture Warnings**
- God objects detection
- Circular dependencies
- Dead code identification
- Large file warnings
- Complex function alerts

💡 **LLM-Ready Prompts**
- One-click copy for Cursor, ChatGPT, etc.
- Multiple format options
- Context-aware suggestions
- Pre-formatted for optimal LLM responses

🎯 **Smart Insights**
- Severity-based prioritization (Error/Warning/Info)
- Categorized by concern area
- Click-to-navigate to issues
- Actionable recommendations

## Supported Languages

- Python (.py)
- JavaScript (.js)
- TypeScript (.ts, .tsx)
- Java (.java)
- Go (.go)
- Rust (.rs)
- C/C++ (.c, .cpp, .h, .hpp)
- Ruby (.rb)
- PHP (.php)

## Installation

### From VSIX (Recommended)

1. Download the latest `.vsix` file from releases
2. Open VSCode
3. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
4. Type "Install from VSIX" and select the file

### From Source

```bash
cd vscode-plugin
npm install
npm run compile
```

Press F5 in VSCode to launch Extension Development Host.

## Usage

### Quick Start

1. Open any code workspace
2. Shadow Watch starts analyzing automatically
3. View insights in the "Shadow Watch" sidebar
4. Click "Copy for LLM" to get formatted prompts

### Commands

| Command | Description |
|---------|-------------|
| `Shadow Watch: Analyze Workspace` | Full workspace analysis |
| `Shadow Watch: Analyze Current File` | Analyze active file only |
| `Shadow Watch: Copy All Insights for LLM` | Copy all insights to clipboard |
| `Shadow Watch: Copy File Insights for LLM` | Copy current file insights |
| `Shadow Watch: Refresh` | Re-run analysis |
| `Shadow Watch: Clear Cache` | Clear all cached results |

### Sidebar View

The Shadow Watch sidebar shows:
- **Health Score**: Overall codebase health (0-100%)
- **Errors**: Critical architecture issues
- **Warnings**: Important but non-critical issues
- **Info**: Suggestions for improvement

Click any issue to jump to the code location.

### Using with LLMs

#### Cursor

1. Click the copy button in Shadow Watch sidebar
2. Paste into Cursor chat
3. Cursor will have full context of your architecture issues

#### ChatGPT

1. Set format to "ChatGPT" in settings
2. Copy insights
3. Paste into ChatGPT with: "Help me fix these architecture issues:"

#### Generic AI Assistants

1. Use "Generic" format for standard markdown
2. Works with any LLM that accepts markdown input

## Configuration

Access settings via `Cmd+,` then search "Shadow Watch"

### Key Settings

```json
{
  "shadowWatch.enabled": true,
  "shadowWatch.analyzeOnSave": true,
  "shadowWatch.analyzeInterval": 30000,
  "shadowWatch.llmFormat": "cursor",
  "shadowWatch.severityThreshold": "warning"
}
```

### LLM Formats

- **cursor**: Optimized for Cursor AI
- **chatgpt**: Verbose format for ChatGPT
- **generic**: Standard markdown
- **compact**: Brief bullet points

## Examples

### Example Output (Cursor Format)

```markdown
# Code Architecture Issues

I have 12 architecture issues that need attention:

## 🔴 Critical Issues (Errors)

### Very Large File

**Category:** Code Organization
**Description:** src/analyzer.ts has 1250 lines of code, indicating potential god object.
**File:** `src/analyzer.ts`
**Suggestion:** Break this file into smaller, focused modules.

## ⚠️ Warnings

### Circular Dependency Detected

**Category:** Dependencies
**Description:** Circular dependency: models/User.ts → utils/validation.ts → models/User.ts
**Suggestion:** Break this cycle by introducing an interface/abstraction.
```

### Example Workflow

1. **Developer writes code** → saves file
2. **Shadow Watch analyzes** → detects 3 new issues
3. **Developer clicks copy** → gets formatted prompt
4. **Developer pastes in Cursor** → "Help me refactor this god object"
5. **Cursor provides solution** → with specific refactoring steps
6. **Developer applies fix** → saves file
7. **Shadow Watch re-analyzes** → issues resolved ✅

## Architecture

Shadow Watch uses the same proven analysis engine as the main Shadow Watch project:

- **Static Analysis**: No code execution required
- **AST Parsing**: Deep function-level analysis
- **Dependency Graphing**: Import relationship tracking
- **Pattern Detection**: Common anti-patterns and code smells

## Performance

- **Initial Analysis**: ~2-5 seconds for medium projects (100-500 files)
- **Incremental Updates**: < 1 second for single file changes
- **Cache**: Reduces repeat analysis time by 80%
- **Background Processing**: Never blocks editing

## AI-Powered Features (New!)

### 🤖 Product Documentation Generation

Generate comprehensive product documentation automatically by analyzing your codebase:

1. Run `Shadow Watch: Analyze Workspace`
2. Run `Shadow Watch: Generate Product Documentation`
3. Enter your OpenAI API key when prompted (stored securely in settings)
4. View generated documentation with:
   - Product overview
   - Key features
   - Architecture description
   - Tech stack
   - API endpoints (if detected)
   - Data models (if detected)

### 🧠 AI Architecture Insights

Get intelligent architectural analysis from GPT-5:

1. Run `Shadow Watch: Analyze Workspace`
2. Run `Shadow Watch: Generate AI Architecture Insights`
3. View comprehensive insights including:
   - Overall architecture assessment
   - Strengths and issues
   - Code organization analysis
   - Folder reorganization suggestions
   - **Cursor-ready refactoring prompts** (copy & paste!)
   - Prioritized recommendations

### ✨ Cursor Integration

When AI suggests folder reorganization:
- Get a complete, copy-paste-ready prompt
- Paste it into Cursor
- Let Cursor execute the entire refactoring automatically!

## Privacy

- ✅ Static analysis happens **locally**
- ✅ No telemetry or tracking
- ⚠️ AI features send code structure to OpenAI (when you explicitly request it)
- ⚠️ API key stored locally in VSCode settings

## Troubleshooting

### "No insights found"

- Check that your workspace contains code files
- Verify file extensions are supported
- Try manually running: `Shadow Watch: Analyze Workspace`

### "Analysis is slow"

- Increase `analyzeInterval` in settings
- Disable `autoAnalyzeWorkspace` for large projects
- Add exclusion patterns for generated code

### "Wrong insights"

- Clear cache: `Shadow Watch: Clear Cache`
- Ensure you're using the latest version
- Check language is supported

## Contributing

Shadow Watch is part of the larger Shadow Watch testing framework. Contributions welcome!

## License

Same as Shadow Watch main project.

## Links

- [Main Shadow Watch Project](https://github.com/yourusername/shadow-watch)
- [Documentation](https://shadow-watch.dev/docs)
- [Report Issues](https://github.com/yourusername/shadow-watch/issues)

---

Made with ❤️ by the Shadow Watch team

