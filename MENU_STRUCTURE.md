# Shadow Watch VSCode Extension - Menu Structure

## Panel 1: Architecture Insights (Main Panel)

### Root Level Items:
1. **🤖 AI Actions** (section, expanded)
   - 📊 Analyze Workspace
   - Generate Product Documentation
   - Generate AI Architecture Insights
   - 🧪 Generate Unit Tests
   - 📁 Open Documentation Folder
   - 🤖 Using: OpenAI (or Claude) - Click to switch provider
   - ⚙️ Open Settings
   - (separator line)
   - ✅ AI Insights Available (if insights exist) - "View in 'AI Architecture Insights' panel"
   - OR "No insights yet" (if no analysis done)
   - OR Static Analysis:
     - X Static Issues Found
     - Health: X%
     - Errors (X) - expandable
     - Warnings (X) - expandable
     - Info (X) - expandable

### Under "Errors (X)":
- Individual error items (clickable to navigate to file)

### Under "Warnings (X)":
- Individual warning items (clickable to navigate to file)

### Under "Info (X)":
- Individual info items (clickable to navigate to file)

---

## Panel 2: Analyze Workspace

### Root Level Items (if analysis exists):
1. **📊 Statistics** (collapsed)
   - Total Files: X
   - Total Lines: X
   - Total Functions: X
   - Large Files (>500 lines): X
   - Imported Files: X
   - Orphaned Files: X

2. **📁 Files (X)** (collapsed)
   - Directory folders (grouped by directory)
     - Under each directory: individual files
       - Under each file:
         - Lines: X
         - Functions: X
         - Language: X
         - Imports (X) - expandable
         - 🔗 Open File

3. **🔤 Languages (X)** (collapsed)
   - Language name (X files) - expandable
     - Under each language: files in that language

4. **⚙️ Functions (X)** (collapsed)
   - File name (X functions) - expandable
     - Under each file: function names

5. **🚪 Entry Points (X)** (collapsed)
   - Entry point paths with type

6. **🔗 Dependencies (X files)** (collapsed)
   - File name (X imports) - expandable
     - Under each file: import paths

7. **🔴 Orphaned Files (X)** (collapsed)
   - Individual orphaned file names

### If no analysis:
- "No analysis available" - "Run 'Analyze Workspace' to see analysis results"

---

## Panel 3: Product Navigator

### Root Level Items (if product docs exist):
1. **📖 Product Overview** (collapsed)
   - Overview text content

2. **✨ What It Does (X)** (collapsed)
   - Individual feature items

3. **👤 User Perspective** (collapsed)
   - 🖥️ GUI (X)
   - ⌨️ CLI (X)
   - 🔌 API (X)
   - 🚀 CI/CD (X)

4. **🔄 Workflow Integration (X)** (collapsed)
   - Individual workflow items

5. **🎯 Problems Solved (X)** (collapsed)
   - Individual problem items

6. **Module Type Sections** (e.g., "🔌 API Modules (X)", "⌨️ CLI Modules (X)", etc.)
   - Under each module type: individual modules
     - Under each module:
       - 📝 Summary
       - Capability items (if any)
       - Endpoints (if any)
       - Commands (if any)
       - Workers (if any)
       - 📁 Files (X)

### If no product docs:
- "No product documentation yet" - "Run 'Generate Product Documentation' to create product navigation"

---

## Panel 4: AI Architecture Insights

### Root Level Items (if insights exist):
1. **🎯 Product Purpose & Architecture Rationale** (collapsed, if available)
   - Product Purpose
   - Architecture Rationale
   - User Goals
   - Design Decisions
   - Contextual Factors

2. **📋 Overall Assessment** (clickable)

3. **✅ Strengths (X)** (collapsed)
   - Individual strength items

4. **⚠️ Issues & Concerns (X)** (collapsed)
   - Individual issue items

5. **📁 Code Organization** (clickable)

6. **🚪 Entry Points Analysis** (clickable)

7. **🔴 Orphaned Files Analysis** (clickable)

8. **🔄 Folder Reorganization** (clickable)

9. **💡 Recommendations (X)** (collapsed)
   - Individual recommendation items

10. **🎯 Refactoring Priorities (X)** (collapsed)
    - Individual priority items

11. **✨ LLM Refactoring Prompt** (clickable)

### If no insights:
- "No architecture insights yet" - "Run 'Generate AI Architecture Insights' to see results"





















