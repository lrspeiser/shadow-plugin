# Shadow Watch VSCode Plugin - Quick Start

Get up and running in 5 minutes!

## For Users

### Install

1. **From Marketplace (Recommended)**
   - Open VSCode
   - Go to Extensions (`Cmd+Shift+X`)
   - Search "Shadow Watch"
   - Click Install

2. **From VSIX File**
   - Download `.vsix` from [releases](https://github.com/yourusername/shadow-watch/releases)
   - Open VSCode
   - Press `Cmd+Shift+P`
   - Type "Install from VSIX"
   - Select downloaded file

### First Run

1. Open any code project in VSCode
2. Look for "Shadow Watch" icon in activity bar (left sidebar)
3. Click to open Shadow Watch panel
4. Click "Analyze Workspace" or wait for auto-analysis

### Use with LLM

1. Review insights in Shadow Watch panel
2. Click the copy button (top right)
3. Paste into Cursor, ChatGPT, or any AI assistant
4. Get specific refactoring advice!

### Example

```
You: [paste Shadow Watch insights]
Cursor: I see you have a god object in src/utils.ts. Let me help you refactor...
```

## For Developers

### Setup

```bash
cd vscode-plugin
npm install
```

### Run in Development

```bash
npm run watch
```

Then press `F5` in VSCode to launch Extension Development Host.

### Build Package

```bash
npm run compile
vsce package
```

This creates `shadow-watch-1.0.0.vsix`.

### Install Locally

```bash
code --install-extension shadow-watch-1.0.0.vsix
```

## Common Use Cases

### 1. Quick Health Check

```
1. Open project
2. Shadow Watch → Analyze
3. Check health score
4. Review critical errors
```

### 2. Pre-Commit Review

```
1. Make changes
2. Save files (auto-analysis)
3. Review new warnings
4. Fix before committing
```

### 3. Refactoring Session

```
1. Copy all insights to Cursor
2. Ask: "Create a refactoring plan"
3. Follow Cursor's suggestions
4. Re-analyze to verify fixes
```

### 4. Code Review Prep

```
1. Analyze branch
2. Copy insights
3. Share with team
4. Discuss in PR
```

## Tips

- **Status Bar**: Shows issue count at a glance
- **Click Issues**: Navigate directly to problem code
- **Filters**: Use severity threshold in settings
- **Formats**: Try different LLM formats for best results

## Keyboard Shortcuts

Add custom shortcuts in VSCode:

```json
{
  "key": "cmd+shift+a",
  "command": "shadowWatch.analyze"
},
{
  "key": "cmd+shift+c",
  "command": "shadowWatch.copyInsights"
}
```

## Troubleshooting

**No insights?**
- Check file types are supported
- Verify workspace has code files
- Run manual analysis

**Too many insights?**
- Increase severity threshold
- Add exclude patterns
- Focus on errors first

**Slow analysis?**
- Increase analyze interval
- Disable auto-analyze for large projects
- Clear cache if stale

## Next Steps

- Read [full documentation](README.md)
- Check [implementation guide](IMPLEMENTATION_GUIDE.md)
- Join [community](https://discord.gg/shadow-watch)

---

Questions? [Open an issue](https://github.com/yourusername/shadow-watch/issues)

