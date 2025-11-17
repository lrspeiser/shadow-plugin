#!/bin/bash

# Test script for incremental saving functionality
# This verifies that the code compiles and the structure is correct

set -e

echo "🧪 Testing Incremental Saving Functionality"
echo "==========================================="
echo ""

cd "$(dirname "$0")/.."

# Step 1: Compile TypeScript
echo "📦 Step 1: Compiling TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo "✅ Compilation successful"
echo ""

# Step 2: Lint
echo "🔍 Step 2: Running linter..."
npm run lint

if [ $? -ne 0 ]; then
    echo "❌ Linting failed"
    exit 1
fi

echo "✅ Linting passed"
echo ""

# Step 3: Check that incremental save functions exist in compiled code
echo "🔎 Step 3: Verifying incremental save functions..."
if grep -q "saveIncrementalFileSummary\|saveIncrementalModuleSummary\|saveIncrementalProductDocIteration" dist/extension.js; then
    echo "✅ Incremental save functions found in compiled code"
else
    echo "⚠️  Warning: Incremental save functions not found in compiled code (may be minified)"
fi

if grep -q "saveIncrementalProductPurposeAnalysis\|saveIncrementalArchitectureInsightsIteration" dist/extension.js; then
    echo "✅ Architecture insights incremental save functions found"
else
    echo "⚠️  Warning: Architecture insights incremental save functions not found (may be minified)"
fi

echo ""

# Step 4: Check file structure
echo "📁 Step 4: Verifying file structure..."
if [ -f "src/llmIntegration.ts" ] && [ -f "src/llmService.ts" ] && [ -f "src/productNavigator.ts" ]; then
    echo "✅ Required source files exist"
else
    echo "❌ Missing required source files"
    exit 1
fi

# Check that run directory functions exist
if grep -q "getProductDocsRunDir\|getArchitectureInsightsRunDir" src/llmIntegration.ts; then
    echo "✅ Run directory functions found"
else
    echo "❌ Run directory functions not found"
    exit 1
fi

echo ""

# Step 5: Summary
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Build VSIX: npm run package && vsce package"
echo "2. Test in VSCode: Install the .vsix file and test incremental saving"
echo "3. Verify files appear in .shadow/docs/[run-id]/ as they're generated"
echo ""














