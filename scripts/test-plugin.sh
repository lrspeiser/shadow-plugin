#!/bin/bash

# Shadow Watch VSCode Plugin - Test Script

echo "🧪 Testing Shadow Watch VSCode Plugin"
echo "======================================"
echo ""

# Check if built
if [ ! -d "dist" ]; then
    echo "⚠️  dist/ directory not found. Building..."
    npm run compile
    
    if [ $? -ne 0 ]; then
        echo "❌ Build failed"
        exit 1
    fi
fi

echo "✅ Extension is built"
echo ""

# Package
echo "📦 Packaging extension..."
vsce package

if [ $? -ne 0 ]; then
    echo "❌ Packaging failed"
    exit 1
fi

VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ No .vsix file found"
    exit 1
fi

echo "✅ Created: $VSIX_FILE"
echo ""

# Ask to install
echo "Install the extension in VSCode? (y/n)"
read -r response

if [ "$response" = "y" ]; then
    echo "Installing..."
    code --install-extension "$VSIX_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Extension installed successfully!"
        echo ""
        echo "To test:"
        echo "1. Reload VSCode window (Cmd+R or Ctrl+R)"
        echo "2. Open a code workspace"
        echo "3. Look for Shadow Watch in the sidebar"
        echo "4. Run 'Shadow Watch: Analyze Workspace' from command palette"
    else
        echo "❌ Installation failed"
        exit 1
    fi
else
    echo "Skipping installation."
    echo "To install manually: code --install-extension $VSIX_FILE"
fi

echo ""
echo "🎉 Testing complete!"

