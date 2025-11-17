#!/bin/bash

# Build Shadow Watch VSIX Extension
# This script ensures the extension is properly compiled and packaged

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PLUGIN_DIR"

echo "🔨 Building Shadow Watch VSIX Extension"
echo "========================================"
echo ""

# Step 1: Compile TypeScript
echo "📦 Step 1/3: Compiling TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo "✅ Compilation successful"
echo ""

# Step 2: Verify dist/extension.js exists
if [ ! -f "dist/extension.js" ]; then
    echo "❌ dist/extension.js not found after compilation"
    exit 1
fi

echo "✅ Verified dist/extension.js exists ($(du -h dist/extension.js | cut -f1))"
echo ""

# Step 3: Package VSIX
echo "📦 Step 2/3: Packaging VSIX..."
vsce package

if [ $? -ne 0 ]; then
    echo "❌ Packaging failed"
    exit 1
fi

echo ""

# Step 4: Verify VSIX was created
VSIX_FILE=$(ls -t shadow-watch-*.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ No VSIX file found after packaging"
    exit 1
fi

echo "✅ Step 3/3: VSIX created successfully"
echo ""
echo "📦 VSIX File: $VSIX_FILE"
echo "   Location: $(pwd)/$VSIX_FILE"
echo "   Size: $(du -h "$VSIX_FILE" | cut -f1)"
echo ""

# Verify VSIX integrity
echo "🔍 Verifying VSIX integrity..."
unzip -t "$VSIX_FILE" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ VSIX file is valid"
else
    echo "❌ VSIX file appears to be corrupted"
    exit 1
fi

echo ""
echo "🎉 Build complete!"
echo ""
echo "To install:"
echo "  code --install-extension $VSIX_FILE"
echo ""
echo "Or in VSCode:"
echo "  1. Open Extensions view (Cmd+Shift+X / Ctrl+Shift+X)"
echo "  2. Click '...' menu"
echo "  3. Select 'Install from VSIX...'"
echo "  4. Choose: $VSIX_FILE"

