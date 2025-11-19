#!/bin/bash

# Build Shadow Watch VSIX Extension
# This script ensures the extension is properly compiled and packaged
# All output is captured for verbose logging and toast notifications

set -euo pipefail

# Logging function for verbose output
log() {
    echo "$1"
}

log_error() {
    echo "❌ ERROR: $1" >&2
}

log_success() {
    echo "✅ SUCCESS: $1"
}

log_step() {
    echo ""
    echo "$1"
    echo "-----------------------------------"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

log "🔨 Building Shadow Watch VSIX Extension"
log "========================================"
log "Working directory: $PLUGIN_DIR"
log "Script directory: $SCRIPT_DIR"
log ""

cd "$PLUGIN_DIR"

# Step 1: Check prerequisites
log_step "📋 Step 1/4: Checking prerequisites..."

if ! command -v npm &> /dev/null; then
    log_error "npm not found. Please install Node.js and npm."
    exit 1
fi
log "  ✓ npm found: $(npm --version)"

if ! command -v node &> /dev/null; then
    log_error "node not found. Please install Node.js."
    exit 1
fi
log "  ✓ node found: $(node --version)"

if ! command -v vsce &> /dev/null; then
    log_error "vsce not found. Please install: npm install -g @vscode/vsce"
    exit 1
fi
log "  ✓ vsce found: $(vsce --version)"

if [ ! -f "package.json" ]; then
    log_error "package.json not found in $PLUGIN_DIR"
    exit 1
fi
log "  ✓ package.json found"

if [ ! -f "webpack.config.js" ]; then
    log_error "webpack.config.js not found in $PLUGIN_DIR"
    exit 1
fi
log "  ✓ webpack.config.js found"

log_success "All prerequisites verified"

# Step 2: Compile TypeScript
log_step "📦 Step 2/4: Compiling TypeScript with Webpack..."
log "Running: npm run compile"
log ""

if npm run compile 2>&1; then
    log_success "TypeScript compilation completed"
else
    COMPILE_EXIT_CODE=$?
    log_error "Compilation failed with exit code $COMPILE_EXIT_CODE"
    log_error "Check TypeScript errors above and verify all dependencies are installed"
    exit 1
fi

# Step 3: Verify dist/extension.js exists
log_step "🔍 Step 3/4: Verifying compilation output..."

if [ ! -f "dist/extension.js" ]; then
    log_error "dist/extension.js not found after compilation"
    log_error "Webpack may have failed to generate the bundle"
    exit 1
fi

EXT_SIZE=$(du -h dist/extension.js | cut -f1)
log "  ✓ dist/extension.js exists (size: $EXT_SIZE)"

if [ ! -d "dist" ]; then
    log_error "dist directory not found"
    exit 1
fi

FILE_COUNT=$(find dist -type f | wc -l | tr -d ' ')
log "  ✓ dist directory contains $FILE_COUNT file(s)"

log_success "Compilation output verified"

# Step 4: Package VSIX
log_step "📦 Step 4/4: Packaging VSIX with vsce..."
log "Running: vsce package"
log ""

if vsce package 2>&1; then
    log_success "VSIX packaging completed"
else
    PACKAGE_EXIT_CODE=$?
    log_error "Packaging failed with exit code $PACKAGE_EXIT_CODE"
    log_error "Check vsce errors above and verify package.json is valid"
    exit 1
fi

# Step 5: Verify VSIX was created
log_step "🔍 Verifying VSIX package..."

VSIX_FILE=$(ls -t shadow-watch-*.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
    log_error "No VSIX file found after packaging"
    log_error "Expected file matching pattern: shadow-watch-*.vsix"
    log "Available files:"
    ls -la *.vsix 2>/dev/null || log "  (no .vsix files found)"
    exit 1
fi

VSIX_SIZE=$(du -h "$VSIX_FILE" | cut -f1)
VSIX_PATH="$(pwd)/$VSIX_FILE"

log "  ✓ VSIX file found: $VSIX_FILE"
log "  ✓ Location: $VSIX_PATH"
log "  ✓ Size: $VSIX_SIZE"

# Verify VSIX integrity
log ""
log "🔍 Testing VSIX integrity with unzip..."

if unzip -t "$VSIX_FILE" > /dev/null 2>&1; then
    log_success "VSIX file structure is valid (zip integrity verified)"
else
    log_error "VSIX file appears to be corrupted"
    log_error "The file may be incomplete or damaged"
    exit 1
fi

# Check VSIX contents
log ""
log "📋 VSIX package contents:"
VSIX_ENTRY_COUNT=$(unzip -l "$VSIX_FILE" | tail -1 | awk '{print $2}')
log "  ✓ Total entries in package: $VSIX_ENTRY_COUNT"

# Check for extension.js
EXT_JS_CHECK=$(unzip -l "$VSIX_FILE" | grep "extension/dist/extension.js" | grep -v LICENSE || true)
if [ -n "$EXT_JS_CHECK" ]; then
    EXT_JS_SIZE=$(echo "$EXT_JS_CHECK" | awk '{print $1}')
    log "  ✓ extension/dist/extension.js found in package (size: $EXT_JS_SIZE bytes)"
else
    log_error "extension/dist/extension.js not found in VSIX package"
    log "Package contents:"
    unzip -l "$VSIX_FILE" | grep -E "(extension|dist)" | head -10
    exit 1
fi

# Check for package.json
PKG_JSON_CHECK=$(unzip -l "$VSIX_FILE" | grep "extension/package.json" || true)
if [ -n "$PKG_JSON_CHECK" ]; then
    PKG_JSON_SIZE=$(echo "$PKG_JSON_CHECK" | awk '{print $1}')
    log "  ✓ extension/package.json found in package (size: $PKG_JSON_SIZE bytes)"
else
    log_error "extension/package.json not found in VSIX package"
    log "Package contents:"
    unzip -l "$VSIX_FILE" | grep "package" | head -10
    exit 1
fi

log ""
log "========================================"
log "🎉 BUILD SUCCESSFUL!"
log "========================================"
log ""
log "📦 VSIX Package Details:"
log "   File: $VSIX_FILE"
log "   Path: $VSIX_PATH"
log "   Size: $VSIX_SIZE"
log "   Entries: $VSIX_ENTRY_COUNT files"
log ""
log "🚀 Installation Instructions:"
log ""
log "Command line:"
log "  code --install-extension $VSIX_FILE"
log ""
log "VSCode UI:"
log "  1. Open Extensions view (Cmd+Shift+X / Ctrl+Shift+X)"
log "  2. Click '...' menu (top right)"
log "  3. Select 'Install from VSIX...'"
log "  4. Choose: $VSIX_FILE"
log ""
log "✅ Build completed successfully at $(date)"

