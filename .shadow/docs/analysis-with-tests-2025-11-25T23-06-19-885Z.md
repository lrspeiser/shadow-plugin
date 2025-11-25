# Analysis + Test Report
Generated: 2025-11-25T23:06:19.885Z

## Analysis Summary
No codebase provided for analysis

### Stats
- Files: 72
- Lines: 51549
- Functions: 0
- Analysis time: 7.0s

### Functions


### Strengths


### Issues
- No file summaries were provided in the input

---

## Test Results
- Tests generated: 1
- Test file: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.js
- **Passed: 0**
- **Failed: 0**

### Test Output
```
jest-haste-map: duplicate manual mock found: vscode
  The following files share their name; please delete one of them:
    * <rootDir>/out/test/__mocks__/vscode.js
    * <rootDir>/src/test/__mocks__/vscode.ts

Test Suites: 0 of 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.014 s
Ran all test suites matching /\/Users\/leonardspeiser\/Projects\/shadow-plugin\/UnitTests\/generated.test.js/i.
Error: Cannot find module '@babel/preset-env'
Require stack:
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/@babel/core/lib/config/files/plugins.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/@babel/core/lib/config/files/index.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/@babel/core/lib/index.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/jest-snapshot/build/InlineSnapshots.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/jest-snapshot/build/State.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/jest-snapshot/build/index.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/jest-runtime/build/index.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/@jest/core/build/cli/index.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/@jest/core/build/index.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/jest-cli/build/run.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/jest-cli/build/index.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/jest-cli/bin/jest.js
- /Users/leonardspeiser/Projects/shadow-plugin/node_modules/jest/bin/jest.js

Make sure that all the Babel plugins and presets you are using
are defined as dependencies or devDependencies in your package.json
file. It's possible that the missing plugin is loaded by a preset
you are using that forgot to add the plugin to its dependencies: you
can workaround this problem by explicitly adding the missing package
to your top-level package.json.

    at Modu
```
