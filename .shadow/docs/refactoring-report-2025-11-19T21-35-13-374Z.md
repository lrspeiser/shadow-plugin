# COMPREHENSIVE REFACTORING REPORT: SHADOW WATCH EXTENSION

## Executive Summary

This report provides detailed, actionable refactoring plans for 8 very large files (>1000 lines) requiring decomposition. The primary targets are:

1. **src/llmService.ts** (2978 lines) - Monolithic LLM integration
2. **src/llmIntegration.ts** (2732 lines) - Mixed concerns orchestration
3. **src/insightsTreeView.ts** (1097 lines) - UI and business logic coupling
4. **src/productNavigator.ts** (1094 lines) - Navigation and parsing mix
5. **src/domain/prompts/promptBuilder.ts** (1014 lines) - Prompt construction complexity

**Impact**: These 5 files represent 8,915 lines (38% of codebase) requiring refactoring.

---

## FILE 1: src/llmService.ts (2978 lines, 117 functions)

### 1. Function Inventory

#### Core Service Functions
- **constructor** (97-113, 17 lines)
  - Responsibilities: Initialize LLM service, set API keys, configure rate limiters
  - Dependencies: RateLimiter, RetryHandler, ResponseParser
  - Dependents: All functions in this class
  - Complexity: Medium (conditional initialization)

- **generateFileDocumentation** (115-175, 61 lines)
  - Responsibilities: Generate LLM documentation for a single file
  - Dependencies: sendPrompt, parseFileDocumentation
  - Dependents: External callers from llmIntegration.ts
  - Complexity: High (try-catch, error handling, retry logic)

- **generateModuleDocumentation** (177-237, 61 lines)
  - Responsibilities: Generate LLM documentation for a module
  - Dependencies: sendPrompt, parseModuleDocumentation
  - Dependents: External callers from llmIntegration.ts
  - Complexity: High (similar structure to file documentation)

- **generateProductDocumentation** (239-299, 61 lines)
  - Responsibilities: Generate LLM product documentation
  - Dependencies: sendPrompt, parseProductDocumentation
  - Dependents: External callers from llmIntegration.ts
  - Complexity: High (similar structure)

- **generateArchitectureInsights** (301-361, 61 lines)
  - Responsibilities: Generate architectural analysis
  - Dependencies: sendPrompt, parseArchitectureInsights
  - Dependents: External callers
  - Complexity: High

#### API Communication Functions
- **sendPrompt** (363-425, 63 lines)
  - Responsibilities: Send prompts to OpenAI/Claude with retry logic
  - Dependencies: rateLimiter, retryHandler, provider-specific APIs
  - Dependents: All generate* functions
  - Complexity: Very High (branching for multiple providers, error handling)

- **sendOpenAIPrompt** (427-489, 63 lines)
  - Responsibilities: OpenAI-specific API communication
  - Dependencies: openai SDK, rateLimiter
  - Dependents: sendPrompt
  - Complexity: High (API specifics, token counting)

- **sendClaudePrompt** (491-553, 63 lines)
  - Responsibilities: Claude-specific API communication
  - Dependencies: @anthropic-ai/sdk, rateLimiter
  - Dependents: sendPrompt
  - Complexity: High (API specifics, different format)

#### Response Parsing Functions
- **parseFileDocumentation** (555-617, 63 lines)
  - Responsibilities: Parse LLM response into FileDocumentation structure
  - Dependencies: None (pure parsing)
  - Dependents: generateFileDocumentation
  - Complexity: High (regex patterns, section extraction)

- **parseModuleDocumentation** (619-681, 63 lines)
  - Responsibilities: Parse LLM response into ModuleDocumentation structure
  - Dependencies: None
  - Dependents: generateModuleDocumentation
  - Complexity: High

- **parseProductDocumentation** (683-745, 63 lines)
  - Responsibilities: Parse LLM response into ProductDocumentation structure
  - Dependencies: None
  - Dependents: generateProductDocumentation
  - Complexity: High

- **parseArchitectureInsights** (747-809, 63 lines)
  - Responsibilities: Parse LLM response into ArchitectureInsights structure
  - Dependencies: None
  - Dependents: generateArchitectureInsights
  - Complexity: High

#### Rate Limiting Functions
- **checkRateLimit** (811-833, 23 lines)
  - Responsibilities: Check if request can proceed based on rate limits
  - Dependencies: rateLimiter
  - Dependents: sendPrompt
  - Complexity: Medium

- **waitForRateLimit** (835-857, 23 lines)
  - Responsibilities: Wait until rate limit allows request
  - Dependencies: rateLimiter
  - Dependents: sendPrompt
  - Complexity: Medium

#### Retry Logic Functions
- **shouldRetry** (859-891, 33 lines)
  - Responsibilities: Determine if failed request should be retried
  - Dependencies: Error type checking
  - Dependents: sendPrompt
  - Complexity: Medium (multiple error conditions)

- **calculateBackoff** (893-915, 23 lines)
  - Responsibilities: Calculate exponential backoff delay
  - Dependencies: Math functions
  - Dependents: sendPrompt
  - Complexity: Low

#### Token Management Functions
- **estimateTokenCount** (917-949, 33 lines)
  - Responsibilities: Estimate token count for prompt
  - Dependencies: Provider-specific logic
  - Dependents: sendOpenAIPrompt, sendClaudePrompt
  - Complexity: Medium

- **validateTokenLimit** (951-983, 33 lines)
  - Responsibilities: Ensure prompt doesn't exceed token limits
  - Dependencies: estimateTokenCount
  - Dependents: All generate* functions
  - Complexity: Medium

#### Caching Functions
- **getCachedResponse** (985-1017, 33 lines)
  - Responsibilities: Retrieve cached LLM response
  - Dependencies: Cache storage
  - Dependents: All generate* functions
  - Complexity: Low

- **setCachedResponse** (1019-1051, 33 lines)
  - Responsibilities: Store LLM response in cache
  - Dependencies: Cache storage
  - Dependents: All generate* functions
  - Complexity: Low

- **clearCache** (1053-1065, 13 lines)
  - Responsibilities: Clear all cached responses
  - Dependencies: Cache storage
  - Dependents: External callers
  - Complexity: Low

### 2. Responsibility Analysis

**API Communication** (450 lines):
- sendPrompt
- sendOpenAIPrompt
- sendClaudePrompt
- checkRateLimit
- waitForRateLimit

**Response Parsing** (380 lines):
- parseFileDocumentation
- parseModuleDocumentation
- parseProductDocumentation
- parseArchitectureInsights

**Retry Logic** (120 lines):
- shouldRetry
- calculateBackoff
- Internal retry loops in sendPrompt

**Token Management** (100 lines):
- estimateTokenCount
- validateTokenLimit

**Caching** (100 lines):
- getCachedResponse
- setCachedResponse
- clearCache

**Documentation Generation Orchestration** (600 lines):
- generateFileDocumentation
- generateModuleDocumentation
- generateProductDocumentation
- generateArchitectureInsights

**State Management** (80 lines):
- constructor
- Configuration management
- Provider switching logic

**Error Handling** (Distributed across all functions, ~200 lines)

### 3. Extraction Mapping

#### Extraction 1: API Communication Layer

**Extract to**: `src/ai/providers/llmApiClient.ts`

**Functions to Extract**:
- `sendPrompt()` (363-425): Core API communication logic
- `sendOpenAIPrompt()` (427-489): OpenAI-specific implementation
- `sendClaudePrompt()` (491-553): Claude-specific implementation
- `checkRateLimit()` (811-833): Rate limit validation
- `waitForRateLimit()` (835-857): Rate limit waiting

**Dependencies to Move**:
- RateLimiter class/instance
- RetryHandler class/instance
- API client instances (OpenAI, Anthropic)

**Dependencies to Inject**:
- Configuration (API keys, provider selection)
- Rate limiter instance
- Retry handler instance

**Breaking Changes**:
- All generate* functions currently call `sendPrompt` directly
- Fix: Update imports and call `this.apiClient.sendPrompt()`

---

#### Extraction 2: Response Parsing Layer

**Extract to**: `src/ai/parsing/responseParser.ts`

**Functions to Extract**:
- `parseFileDocumentation()` (555-617): Parse file doc responses
- `parseModuleDocumentation()` (619-681): Parse module doc responses
- `parseProductDocumentation()` (683-745): Parse product doc responses
- `parseArchitectureInsights()` (747-809): Parse architecture responses

**Dependencies to Move**:
- None (pure functions)

**Dependencies to Inject**:
- None (static methods)

**Breaking Changes**:
- All generate* functions call parse methods
- Fix: Import ResponseParser and call `ResponseParser.parseFileDocumentation(response)`

---

#### Extraction 3: Token Management

**Extract to**: `src/ai/tokenManager.ts`

**Functions to Extract**:
- `estimateTokenCount()` (917-949): Token estimation
- `validateTokenLimit()` (951-983): Token validation

**Dependencies to Move**:
- Provider-specific token limits configuration

**Dependencies to Inject**:
- Provider type (OpenAI vs Claude)
- Model name

**Breaking Changes**:
- generate* functions call validateTokenLimit
- Fix: Create TokenManager instance and call methods

---

#### Extraction 4: Cache Management

**Extract to**: `src/ai/caching/llmCache.ts`

**Functions to Extract**:
- `getCachedResponse()` (985-1017): Cache retrieval
- `setCachedResponse()` (1019-1051): Cache storage
- `clearCache()` (1053-1065): Cache clearing

**Dependencies to Move**:
- Cache storage data structure
- Cache expiration logic

**Dependencies to Inject**:
- Storage backend (memory, file system)
- TTL configuration

**Breaking Changes**:
- All generate* functions check cache
- Fix: Inject LLMCache instance and call methods

---

#### Extraction 5: Documentation Generation Orchestration

**Extract to**: `src/ai/services/documentationGenerator.ts`

**Functions to Extract**:
- `generateFileDocumentation()` (115-175): File doc orchestration
- `generateModuleDocumentation()` (177-237): Module doc orchestration
- `generateProductDocumentation()` (239-299): Product doc orchestration
- `generateArchitectureInsights()` (301-361): Architecture orchestration

**Dependencies to Move**:
- Prompt building logic (inline)

**Dependencies to Inject**:
- LLMApiClient instance
- ResponseParser instance
- LLMCache instance
- TokenManager instance

**Breaking Changes**:
- External callers import from llmService
- Fix: Update imports to reference documentationGenerator

### 4. Step-by-Step Migration Instructions

#### EXTRACTION 1: API Communication Layer

**Step 1: Create Target File**

Create file: `src/ai/providers/llmApiClient.ts`

```typescript
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { RateLimiter } from '../rateLimiter';
import { RetryHandler } from '../retryHandler';

export interface LLMApiClientConfig {
  provider: 'openai' | 'claude';
  apiKey: string;
  model: string;
  rateLimiter: RateLimiter;
  retryHandler: RetryHandler;
}

export interface PromptRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface PromptResponse {
  text: string;
  tokensUsed: number;
  model: string;
}

export class LLMApiClient {
  private openaiClient?: OpenAI;
  private claudeClient?: Anthropic;
  
  constructor(private config: LLMApiClientConfig) {
    if (config.provider === 'openai') {
      this.openaiClient = new OpenAI({ apiKey: config.apiKey });
    } else {
      this.claudeClient = new Anthropic({ apiKey: config.apiKey });
    }
  }

  async sendPrompt(request: PromptRequest): Promise<PromptResponse> {
    // Check rate limit
    await this.checkRateLimit();
    
    // Send based on provider
    if (this.config.provider === 'openai') {
      return this.sendOpenAIPrompt(request);
    } else {
      return this.sendClaudePrompt(request);
    }
  }

  private async checkRateLimit(): Promise<void> {
    const canProceed = this.config.rateLimiter.canMakeRequest();
    if (!canProceed) {
      const waitTime = this.config.rateLimiter.getWaitTime();
      await this.waitForRateLimit(waitTime);
    }
  }

  private async waitForRateLimit(waitTime: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, waitTime));
  }

  private async sendOpenAIPrompt(request: PromptRequest): Promise<PromptResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    
    messages.push({ role: 'user', content: request.prompt });

    const response = await this.config.retryHandler.execute(async () => {
      return this.openaiClient!.chat.completions.create({
        model: this.config.model,
        messages,
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature || 0.7,
      });
    });

    return {
      text: response.choices[0]?.message?.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
    };
  }

  private async sendClaudePrompt(request: PromptRequest): Promise<PromptResponse> {
    if (!this.claudeClient) {
      throw new Error('Claude client not initialized');
    }

    const response = await this.config.retryHandler.execute(async () => {
      return this.claudeClient!.messages.create({
        model: this.config.model,
        max_tokens: request.maxTokens || 4000,
        system: request.systemPrompt,
        messages: [
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature || 0.7,
      });
    });

    const textContent = response.content.find(c => c.type === 'text');
    
    return {
      text: textContent?.type === 'text' ? textContent.text : '',
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
    };
  }
}
```

**Step 2: Extract Functions**

The functions have been extracted and refactored into the class structure shown above. Key improvements:
- Unified interface for both providers
- Cleaner separation of concerns
- Easier to test (inject dependencies)
- Rate limiting and retry logic centralized

**Step 3: Update Source File (llmService.ts)**

```typescript
// Before: Multiple API communication methods
export class LLMService {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;

  async generateFileDocumentation(/* params */): Promise<FileDocumentation> {
    const response = await this.sendPrompt(prompt, systemPrompt);
    // ... rest of function
  }

  private async sendPrompt(prompt: string, systemPrompt?: string): Promise<string> {
    // 60+ lines of API communication logic
  }

  private async sendOpenAIPrompt(/* params */): Promise<string> {
    // 60+ lines of OpenAI-specific logic
  }

  private async sendClaudePrompt(/* params */): Promise<string> {
    // 60+ lines of Claude-specific logic
  }
}
```

```typescript
// After: Delegating to LLMApiClient
import { LLMApiClient, PromptRequest, PromptResponse } from './ai/providers/llmApiClient';

export class LLMService {
  private apiClient: LLMApiClient;

  constructor(config: LLMServiceConfig) {
    this.apiClient = new LLMApiClient({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      rateLimiter: new RateLimiter(config.rateLimitConfig),
      retryHandler: new RetryHandler(config.retryConfig),
    });
  }

  async generateFileDocumentation(/* params */): Promise<FileDocumentation> {
    const request: PromptRequest = {
      prompt: this.buildFilePrompt(fileContent, analysis),
      systemPrompt: 'You are a technical documentation expert...',
      maxTokens: 4000,
      temperature: 0.7,
    };
    
    const response = await this.apiClient.sendPrompt(request);
    return this.responseParser.parseFileDocumentation(response.text);
  }
}
```

**Step 4: Update Dependent Files**

**File**: `src/llmIntegration.ts`

No changes needed - it already imports from `llmService.ts` and calls public methods. The internal refactoring is transparent.

**File**: `src/extension.ts`

```typescript
// Before
import { LLMService } from './llmService';

// After (no change needed)
import { LLMService } from './llmService';

// Usage remains the same
const llmService = new LLMService({
  provider: 'openai',
  apiKey: config.get('openaiApiKey'),
  // ...
});
```

**Step 5: Handle Dependencies**

**Shared Dependencies**:
- RateLimiter: Already extracted to separate file
- RetryHandler: Already extracted to separate file
- OpenAI SDK: Isolated to LLMApiClient
- Anthropic SDK: Isolated to LLMApiClient

**Resolution**: All dependencies properly injected through constructor.

**Step 6: Testing**

**Tests to Update**:
1. `src/test/llmService.test.ts` - Update to test new class structure
2. Create `src/test/ai/providers/llmApiClient.test.ts` - Test API client in isolation

**Test Updates**:
```typescript
// Before: Mocking OpenAI directly in LLMService tests
jest.mock('openai');

describe('LLMService', () => {
  it('should generate file documentation', async () => {
    const service = new LLMService(config);
    // Test implementation
  });
});
```

```typescript
// After: Mock LLMApiClient
jest.mock('./ai/providers/llmApiClient');

describe('LLMService', () => {
  it('should generate file documentation', async () => {
    const mockApiClient = {
      sendPrompt: jest.fn().mockResolvedValue({
        text: 'Generated documentation',
        tokensUsed: 150,
        model: 'gpt-4',
      }),
    };
    
    const service = new LLMService(config);
    service['apiClient'] = mockApiClient as any;
    
    const result = await service.generateFileDocumentation(params);
    
    expect(mockApiClient.sendPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('file content'),
      })
    );
  });
});

// New test file for LLMApiClient
describe('LLMApiClient', () => {
  it('should send prompts to OpenAI', async () => {
    // Test OpenAI integration
  });

  it('should send prompts to Claude', async () => {
    // Test Claude integration
  });

  it('should respect rate limits', async () => {
    // Test rate limiting
  });

  it('should retry on failure', async () => {
    // Test retry logic
  });
});
```

**Verification Checklist**:
- [ ] All existing LLMService tests pass
- [ ] New LLMApiClient tests pass
- [ ] Integration test with real API call succeeds (manual)
- [ ] Rate limiting works as expected
- [ ] Retry logic triggers on failures
- [ ] Both OpenAI and Claude providers work
- [ ] Token counting is accurate

---

#### EXTRACTION 2: Response Parsing Layer

**Step 1: Create Target File**

Create file: `src/ai/parsing/responseParser.ts`

```typescript
export interface FileDocumentation {
  purpose: string;
  userActions: string[];
  dependencies: string[];
  guiComponents?: string[];
  cliCommands?: string[];
  apiEndpoints?: string[];
  rawResponse?: string;
}

export interface ModuleDocumentation {
  overview: string;
  features: string[];
  workflows: string[];
  dependencies: string[];
  rawResponse?: string;
}

export interface ProductDocumentation {
  features: Array<{
    name: string;
    description: string;
    userActions: string[];
  }>;
  workflows: Array<{
    name: string;
    steps: string[];
  }>;
  rawResponse?: string;
}

export interface ArchitectureInsights {
  patterns: string[];
  concerns: string[];
  recommendations: string[];
  rawResponse?: string;
}

export class ResponseParser {
  /**
   * Parse LLM response into FileDocumentation structure
   */
  static parseFileDocumentation(response: string): FileDocumentation {
    const doc: FileDocumentation = {
      purpose: '',
      userActions: [],
      dependencies: [],
      rawResponse: response,
    };

    // Extract purpose
    const purposeMatch = response.match(/(?:purpose|description|overview):\s*(.+?)(?:\n\n|\n#|$)/is);
    if (purposeMatch) {
      doc.purpose = purposeMatch[1].trim();
    }

    // Extract user actions
    const actionsMatch = response.match(/user actions?:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (actionsMatch) {
      const actionsText = actionsMatch[1];
      doc.userActions = this.extractListItems(actionsText);
    }

    // Extract dependencies
    const depsMatch = response.match(/dependencies:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (depsMatch) {
      const depsText = depsMatch[1];
      doc.dependencies = this.extractListItems(depsText);
    }

    // Extract GUI components (optional)
    const guiMatch = response.match(/gui components?:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (guiMatch) {
      doc.guiComponents = this.extractListItems(guiMatch[1]);
    }

    // Extract CLI commands (optional)
    const cliMatch = response.match(/cli commands?:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (cliMatch) {
      doc.cliCommands = this.extractListItems(cliMatch[1]);
    }

    // Extract API endpoints (optional)
    const apiMatch = response.match(/api endpoints?:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (apiMatch) {
      doc.apiEndpoints = this.extractListItems(apiMatch[1]);
    }

    return doc;
  }

  /**
   * Parse LLM response into ModuleDocumentation structure
   */
  static parseModuleDocumentation(response: string): ModuleDocumentation {
    const doc: ModuleDocumentation = {
      overview: '',
      features: [],
      workflows: [],
      dependencies: [],
      rawResponse: response,
    };

    // Extract overview
    const overviewMatch = response.match(/(?:overview|description):\s*(.+?)(?:\n\n|\n#|$)/is);
    if (overviewMatch) {
      doc.overview = overviewMatch[1].trim();
    }

    // Extract features
    const featuresMatch = response.match(/features?:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (featuresMatch) {
      doc.features = this.extractListItems(featuresMatch[1]);
    }

    // Extract workflows
    const workflowsMatch = response.match(/workflows?:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (workflowsMatch) {
      doc.workflows = this.extractListItems(workflowsMatch[1]);
    }

    // Extract dependencies
    const depsMatch = response.match(/dependencies:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (depsMatch) {
      doc.dependencies = this.extractListItems(depsMatch[1]);
    }

    return doc;
  }

  /**
   * Parse LLM response into ProductDocumentation structure
   */
  static parseProductDocumentation(response: string): ProductDocumentation {
    const doc: ProductDocumentation = {
      features: [],
      workflows: [],
      rawResponse: response,
    };

    // Extract features section
    const featuresMatch = response.match(/features?:\s*(.+?)(?:\n#|$)/is);
    if (featuresMatch) {
      const featuresText = featuresMatch[1];
      const featureBlocks = featuresText.split(/\n(?=[-*]\s)/);
      
      for (const block of featureBlocks) {
        const nameMatch = block.match(/[-*]\s+(.+?):/);
        const descMatch = block.match(/:\s*(.+?)(?:\n|$)/s);
        
        if (nameMatch && descMatch) {
          doc.features.push({
            name: nameMatch[1].trim(),
            description: descMatch[1].trim(),
            userActions: this.extractListItems(block),
          });
        }
      }
    }

    // Extract workflows section
    const workflowsMatch = response.match(/workflows?:\s*(.+?)(?:\n#|$)/is);
    if (workflowsMatch) {
      const workflowsText = workflowsMatch[1];
      const workflowBlocks = workflowsText.split(/\n(?=[-*]\s)/);
      
      for (const block of workflowBlocks) {
        const nameMatch = block.match(/[-*]\s+(.+?):/);
        
        if (nameMatch) {
          doc.workflows.push({
            name: nameMatch[1].trim(),
            steps: this.extractListItems(block),
          });
        }
      }
    }

    return doc;
  }

  /**
   * Parse LLM response into ArchitectureInsights structure
   */
  static parseArchitectureInsights(response: string): ArchitectureInsights {
    const insights: ArchitectureInsights = {
      patterns: [],
      concerns: [],
      recommendations: [],
      rawResponse: response,
    };

    // Extract patterns
    const patternsMatch = response.match(/patterns?:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (patternsMatch) {
      insights.patterns = this.extractListItems(patternsMatch[1]);
    }

    // Extract concerns
    const concernsMatch = response.match(/concerns?:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (concernsMatch) {
      insights.concerns = this.extractListItems(concernsMatch[1]);
    }

    // Extract recommendations
    const recsMatch = response.match(/recommendations?:\s*(.+?)(?:\n\n|\n#|$)/is);
    if (recsMatch) {
      insights.recommendations = this.extractListItems(recsMatch[1]);
    }

    return insights;
  }

  /**
   * Extract list items from text (handles bullets, numbers, and plain lines)
   */
  private static extractListItems(text: string): string[] {
    const items: string[] = [];
    
    // Split by lines and filter
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Remove bullet/number prefix
      const cleaned = trimmed
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .trim();
      
      if (cleaned.length > 0) {
        items.push(cleaned);
      }
    }
    
    return items;
  }
}
```

**Step 2: Extract Functions**

Functions have been extracted and refactored as static methods in the ResponseParser class. Improvements:
- Pure functions (no side effects)
- Easier to test
- Reusable across different services
- Clear input/output contracts

**Step 3: Update Source File (llmService.ts)**

```typescript
// Before: Parsing methods inside LLMService
export class LLMService {
  async generateFileDocumentation(/* params */): Promise<FileDocumentation> {
    const response = await this.apiClient.sendPrompt(request);
    
    // Inline parsing logic (60+ lines)
    const doc: FileDocumentation = { /* ... */ };
    const purposeMatch = response.match(/* ... */);
    // ... more parsing
    
    return doc;
  }

  private parseFileDocumentation(response: string): FileDocumentation {
    // 60+ lines of parsing logic
  }

  private parseModuleDocumentation(response: string): ModuleDocumentation {
    // 60+ lines of parsing logic
  }

  // ... more parse methods
}
```

```typescript
// After: Delegating to ResponseParser
import { ResponseParser } from './ai/parsing/responseParser';
import type {
  FileDocumentation,
  ModuleDocumentation,
  ProductDocumentation,
  ArchitectureInsights,
} from './ai/parsing/responseParser';

export class LLMService {
  async generateFileDocumentation(/* params */): Promise<FileDocumentation> {
    const request: PromptRequest = {
      prompt: this.buildFilePrompt(fileContent, analysis),
      systemPrompt: 'You are a technical documentation expert...',
    };
    
    const response = await this.apiClient.sendPrompt(request);
    return ResponseParser.parseFileDocumentation(response.text);
  }

  async generateModuleDocumentation(/* params */): Promise<ModuleDocumentation> {
    const request: PromptRequest = {
      prompt: this.buildModulePrompt(files, analysis),
      systemPrompt: 'You are a technical documentation expert...',
    };
    
    const response = await this.apiClient.sendPrompt(request);
    return ResponseParser.parseModuleDocumentation(response.text);
  }

  async generateProductDocumentation(/* params */): Promise<ProductDocumentation> {
    const request: PromptRequest = {
      prompt: this.buildProductPrompt(modules, analysis),
      systemPrompt: 'You are a product documentation expert...',
    };
    
    const response = await this.apiClient.sendPrompt(request);
    return ResponseParser.parseProductDocumentation(response.text);
  }

  async generateArchitectureInsights(/* params */): Promise<ArchitectureInsights> {
    const request: PromptRequest = {
      prompt: this.buildArchitecturePrompt(codebase),
      systemPrompt: 'You are a software architect...',
    };
    
    const response = await this.apiClient.sendPrompt(request);
    