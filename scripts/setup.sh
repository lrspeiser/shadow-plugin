#!/bin/bash

# Shadow Watch VSCode Plugin - Setup Script

echo "🚀 Shadow Watch VSCode Plugin Setup"
echo "===================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Install vsce globally (for packaging)
echo "📦 Installing vsce (VSCode Extension Manager)..."
npm install -g @vscode/vsce

if [ $? -ne 0 ]; then
    echo "⚠️  Failed to install vsce globally. You can install it later with:"
    echo "   npm install -g @vscode/vsce"
else
    echo "✅ vsce installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run watch' to start development"
echo "2. Press F5 in VSCode to launch Extension Development Host"
echo "3. Test the extension in the new VSCode window"
echo ""
echo "To build a package:"
echo "  npm run compile"
echo "  vsce package"
echo ""
echo "To install locally:"
echo "  code --install-extension shadow-watch-1.0.0.vsix"
echo ""
echo "Happy coding! 🚀"

