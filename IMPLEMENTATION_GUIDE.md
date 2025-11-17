# Shadow Watch VSCode Plugin - Implementation Guide

This guide walks through building, testing, and publishing the Shadow Watch VSCode extension.

## Prerequisites

- Node.js 16+ and npm
- VSCode 1.80+
- TypeScript knowledge (basic)
- `vsce` (VSCode Extension Manager)

## Setup

### 1. Install Dependencies

```bash
cd vscode-plugin
npm install
```

### 2. Install VSCE (for packaging)

```bash
npm install -g @vscode/vsce
```

## Development

### Build & Watch

For active development with auto-rebuild:

```bash
npm run watch
```

This watches for file changes and recompiles automatically.

### Run Extension in Development

1. Open `vscode-plugin` folder in VSCode
2. Press `F5` to launch Extension Development Host
3. This opens a new VSCode window with your extension loaded
4. Open a code workspace in the new window to test

### Debug

- Set breakpoints in `.ts` files
- Use Debug Console in host VSCode window
- Logs appear in Debug Console with `console.log()`

## Testing

### Manual Testing Checklist

**Initial Load:**
- [ ] Extension activates on startup
- [ ] Shadow Watch sidebar appears
- [ ] Status bar item shows "Shadow Watch"

**Analysis:**
- [ ] Run "Shadow Watch: Analyze Workspace"
- [ ] Progress notification appears
- [ ] Insights populate in sidebar
- [ ] Problems panel shows diagnostics

**Insights View:**
- [ ] Health score displays
- [ ] Errors/Warnings/Info categories expand
- [ ] Click on insight navigates to file
- [ ] Tooltips show full details

**Copy to LLM:**
- [ ] Click copy button copies to clipboard
- [ ] Format matches selected LLM format
- [ ] Paste into Cursor/ChatGPT works

**File Analysis:**
- [ ] Open a code file
- [ ] Save the file
- [ ] Auto-analysis triggers (if enabled)
- [ ] File-specific insights appear

**Configuration:**
- [ ] Change settings in preferences
- [ ] Settings take effect immediately
- [ ] Enable/disable extension works

### Test Projects

Create test scenarios with:

1. **Small Clean Project** (5-10 files)
   - Should show few/no issues
   - Tests baseline functionality

2. **Large Complex Project** (100+ files)
   - Should detect multiple issues
   - Tests performance

3. **Problem Project** (intentionally messy)
   - Create god objects (1000+ line files)
   - Add circular dependencies
   - Leave orphaned files
   - Tests detection accuracy

### Automated Testing

```bash
npm run test
```

(Note: You'll need to add test files in `src/test/`)

## Building

### Compile TypeScript

```bash
npm run compile
```

This produces JavaScript in `dist/` directory.

### Package Extension

```bash
vsce package
```

This creates a `.vsix` file you can install.

### Install VSIX Locally

```bash
code --install-extension shadow-watch-1.0.0.vsix
```

Or in VSCode: Extensions → ... → Install from VSIX

## Publishing

### To VSCode Marketplace

1. **Create Publisher Account**
   - Go to https://marketplace.visualstudio.com/
   - Sign in with Microsoft account
   - Create a publisher

2. **Get Personal Access Token**
   - Go to Azure DevOps
   - Create PAT with Marketplace scope

3. **Login to VSCE**
   ```bash
   vsce login <publisher-name>
   ```

4. **Publish**
   ```bash
   vsce publish
   ```

### To GitHub Releases

1. Create release on GitHub
2. Attach `.vsix` file
3. Users can download and install manually

### Version Management

Update version in `package.json`:

```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

Then rebuild and publish.

## File Structure

```
vscode-plugin/
├── src/
│   ├── extension.ts           # Main entry point
│   ├── analyzer.ts            # Code analysis engine
│   ├── insightGenerator.ts    # Insight generation
│   ├── llmFormatter.ts        # LLM prompt formatting
│   ├── fileWatcher.ts         # File monitoring
│   ├── diagnosticsProvider.ts # VSCode diagnostics
│   ├── insightsTreeView.ts    # Sidebar tree view
│   └── cache.ts               # Analysis caching
├── dist/                      # Compiled JS (generated)
├── images/
│   └── icon.png               # Extension icon
├── package.json               # Extension manifest
├── tsconfig.json              # TypeScript config
├── webpack.config.js          # Build config
└── README.md                  # User documentation
```

## Key Components

### 1. Extension Activation

`extension.ts` - `activate()` function:
- Initializes all components
- Registers commands
- Sets up file watcher
- Creates status bar item

### 2. Code Analysis

`analyzer.ts` - `CodeAnalyzer` class:
- Scans workspace for code files
- Extracts functions and imports
- Builds dependency graph
- Detects entry points

### 3. Insight Generation

`insightGenerator.ts` - `InsightGenerator` class:
- Analyzes code metrics
- Detects anti-patterns
- Generates actionable insights
- Categorizes by severity

### 4. LLM Formatting

`llmFormatter.ts` - `LLMFormatter` class:
- Formats insights for different LLMs
- Cursor, ChatGPT, generic formats
- Context-aware prompts

### 5. Tree View

`insightsTreeView.ts` - `InsightsTreeProvider` class:
- Displays insights in sidebar
- Hierarchical view (categories → insights)
- Click-to-navigate functionality
- Health score calculation

## Configuration

Extension contributes these VS Code settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `shadowWatch.enabled` | boolean | true | Enable/disable extension |
| `shadowWatch.analyzeOnSave` | boolean | true | Auto-analyze on save |
| `shadowWatch.analyzeInterval` | number | 30000 | Min ms between analyses |
| `shadowWatch.llmFormat` | string | "cursor" | LLM prompt format |
| `shadowWatch.severityThreshold` | string | "warning" | Min severity to show |

## Commands

Extension contributes these commands:

- `shadowWatch.analyze` - Full workspace analysis
- `shadowWatch.analyzeFile` - Analyze current file
- `shadowWatch.copyInsights` - Copy all insights
- `shadowWatch.copyFileInsights` - Copy file insights
- `shadowWatch.clearCache` - Clear analysis cache
- `shadowWatch.showInsights` - Show sidebar
- `shadowWatch.enable` - Enable extension
- `shadowWatch.disable` - Disable extension

## Performance Optimization

### Caching Strategy

- Analysis results cached per workspace
- Cache invalidated after 24 hours
- Incremental updates for file changes

### Throttling

- File save events throttled (default: 30s)
- Prevents excessive re-analysis
- Configurable via settings

### Async Processing

- Analysis runs in background thread
- Doesn't block UI or editing
- Progress shown via notifications

## Troubleshooting

### Extension Won't Activate

1. Check VSCode version (must be 1.80+)
2. Look for errors in Developer Tools (Help → Toggle Developer Tools)
3. Verify `package.json` activation events

### Analysis Not Running

1. Check if extension is enabled in settings
2. Verify workspace has code files
3. Check exclude patterns aren't too broad

### Performance Issues

1. Increase `analyzeInterval`
2. Add more exclude patterns
3. Disable `autoAnalyzeWorkspace` for huge projects

### Build Errors

1. Delete `node_modules` and run `npm install` again
2. Clear TypeScript cache: `rm -rf dist out`
3. Update TypeScript: `npm update typescript`

## Future Enhancements

### Planned Features

1. **AI-Powered Insights** (Optional)
   - Use OpenAI API for deeper analysis
   - Contextual refactoring suggestions
   - Architecture pattern recognition

2. **Team Sharing**
   - Export/import configuration
   - Shared architecture rules
   - Team health dashboard

3. **CI/CD Integration**
   - GitHub Action support
   - GitLab CI integration
   - Quality gates

4. **More Languages**
   - Kotlin, Swift, Scala
   - Elixir, Clojure
   - Shell scripts

### Contributing

To add a new insight type:

1. Add detection logic in `insightGenerator.ts`
2. Add formatting logic in `llmFormatter.ts`
3. Update tests
4. Document in README

To add a new language:

1. Add extension mapping in `analyzer.ts` (`CODE_EXTENSIONS`)
2. Add function extraction logic (`extractFunctions()`)
3. Add import extraction logic (`extractImports()`)
4. Test with sample project

## Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)

## Support

- GitHub Issues: [Report bugs](https://github.com/yourusername/shadow-watch/issues)
- Discussions: [Ask questions](https://github.com/yourusername/shadow-watch/discussions)
- Discord: [Join community](https://discord.gg/shadow-watch)

---

Happy coding! 🚀

