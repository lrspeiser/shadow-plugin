/**
 * JSON Schemas for Claude Structured Outputs
 * These schemas guarantee valid, parseable responses without manual parsing
 */

export const productPurposeAnalysisSchema = {
    type: "object",
    properties: {
        productPurpose: {
            type: "string",
            description: "What the product is trying to achieve"
        },
        architectureRationale: {
            type: "string",
            description: "Why the current architecture exists (e.g., why multiple entry points)"
        },
        designDecisions: {
            type: "array",
            items: { type: "string" },
            description: "Key architectural decisions and their reasons"
        },
        userGoals: {
            type: "array",
            items: { type: "string" },
            description: "What users are trying to accomplish with this product"
        },
        contextualFactors: {
            type: "array",
            items: { type: "string" },
            description: "Factors that influence architecture (e.g., multi-interface, extensibility)"
        }
    },
    required: ["productPurpose", "architectureRationale", "designDecisions", "userGoals", "contextualFactors"],
    additionalProperties: false
};

const issueItemSchema = {
    type: "object",
    properties: {
        title: {
            type: "string",
            description: "Human-readable title that clearly describes the issue (e.g., 'Root Directory Clutter' not 'Multiple files in root')"
        },
        description: {
            type: "string",
            description: "Detailed description including the problem and proposed fix. Format: [Problem description]. **Proposed Fix**: [Detailed solution with steps]"
        },
        relevantFiles: {
            type: "array",
            items: { type: "string" },
            description: "Array of file paths that are relevant to this issue (e.g., ['src/main.ts', 'package.json'])"
        },
        relevantFunctions: {
            type: "array",
            items: { type: "string" },
            description: "Array of function/class names that are relevant to this issue (e.g., ['initializeApp', 'UserService'])"
        }
    },
    required: ["title", "description"],
    additionalProperties: false
};

const recommendationItemSchema = {
    type: "object",
    properties: {
        title: {
            type: "string",
            description: "Human-readable title for the recommendation (e.g., 'Consolidate Entry Points' not 'Refactor entry points')"
        },
        description: {
            type: "string",
            description: "Detailed recommendation in format: 'If you want [goal X]: [then refactor this way] - [rationale]'"
        },
        relevantFiles: {
            type: "array",
            items: { type: "string" },
            description: "Array of file paths relevant to this recommendation"
        },
        relevantFunctions: {
            type: "array",
            items: { type: "string" },
            description: "Array of function/class names relevant to this recommendation"
        }
    },
    required: ["title", "description"],
    additionalProperties: false
};

const priorityItemSchema = {
    type: "object",
    properties: {
        title: {
            type: "string",
            description: "Human-readable title for the priority (e.g., 'Organize Documentation Files' not 'Move .md files')"
        },
        description: {
            type: "string",
            description: "Detailed description of the priority with rationale"
        },
        relevantFiles: {
            type: "array",
            items: { type: "string" },
            description: "Array of file paths relevant to this priority"
        },
        relevantFunctions: {
            type: "array",
            items: { type: "string" },
            description: "Array of function/class names relevant to this priority"
        }
    },
    required: ["title", "description"],
    additionalProperties: false
};

const fileRequestSchema = {
    type: "object",
    properties: {
        type: { type: "string", enum: ["file"] },
        path: { type: "string", description: "Relative path to the file (e.g., 'src/main.ts')" },
        reason: { type: "string", description: "Why you need this file" }
    },
    required: ["type", "path"],
    additionalProperties: false
};

const grepRequestSchema = {
    type: "object",
    properties: {
        type: { type: "string", enum: ["grep"] },
        pattern: { type: "string", description: "Regex pattern to search for (case-insensitive)" },
        filePattern: { type: "string", description: "Optional glob pattern to limit search (e.g., '*.ts', 'src/**/*.py')" },
        maxResults: { type: "number", description: "Max number of results to return (default: 20)" },
        reason: { type: "string", description: "Why you need this search" }
    },
    required: ["type", "pattern"],
    additionalProperties: false
};

// Unified request schema (replace unsupported oneOf with a superset schema)
const requestItemSchema = {
    type: "object",
    properties: {
        type: { type: "string", enum: ["file", "grep"] },
        // File request fields
        path: { type: "string", description: "Relative path to the file (e.g., 'src/main.ts')" },
        // Grep request fields
        pattern: { type: "string", description: "Regex pattern to search for (case-insensitive)" },
        filePattern: { type: "string", description: "Optional glob pattern to limit search (e.g., '*.ts', 'src/**/*.py')" },
        maxResults: { type: "number", description: "Max number of results to return (default: 20)" },
        // Common
        reason: { type: "string", description: "Why you need this request" }
    },
    required: ["type"],
    additionalProperties: false
};

export const llmInsightsSchema = {
    type: "object",
    properties: {
        overallAssessment: {
            type: "string",
            description: "Overall architecture assessment (2-3 paragraphs). If you need more information to complete this, use the requests field."
        },
        strengths: {
            type: "array",
            items: { type: "string" },
            description: "Architecture strengths"
        },
        issues: {
            type: "array",
            items: issueItemSchema,
            description: "Issues and concerns. Each issue must have a human-readable title, detailed description with proposed fix, and relevant files/functions."
        },
        organization: {
            type: "string",
            description: "Code organization analysis (2-3 paragraphs). If you need more information, use the requests field."
        },
        entryPointsAnalysis: {
            type: "string",
            description: "Analysis of entry points"
        },
        orphanedFilesAnalysis: {
            type: "string",
            description: "Analysis of orphaned files"
        },
        folderReorganization: {
            type: "string",
            description: "Detailed folder reorganization suggestions"
        },
        recommendations: {
            type: "array",
            items: recommendationItemSchema,
            description: "Contextual recommendations. Each recommendation must have a human-readable title, detailed description, and relevant files/functions."
        },
        priorities: {
            type: "array",
            items: priorityItemSchema,
            description: "Top 3-5 refactoring priorities. Each priority must have a human-readable title, detailed description with rationale, and relevant files/functions."
        },
        cursorPrompt: {
            type: "string",
            description: "LLM refactoring prompt (optional)"
        },
        requests: {
            type: "array",
            items: {
                // oneOf unsupported by provider; use unified superset schema
                ...requestItemSchema
            },
            description: "Optional: Request specific files or grep searches to get more information. Use this if you need to examine specific code to provide better analysis. Maximum 5 requests per iteration."
        }
    },
    required: ["overallAssessment", "strengths", "issues", "organization", "entryPointsAnalysis", "orphanedFilesAnalysis", "folderReorganization", "recommendations", "priorities"],
    additionalProperties: false
};

export const productDocumentationSchema = {
    type: "object",
    properties: {
        overview: {
            type: "string",
            description: "Product overview (2-3 paragraphs describing what THIS SPECIFIC application is from a user perspective). If you need more information, use the requests field."
        },
        whatItDoes: {
            type: "array",
            items: { type: "string" },
            description: "Specific user-facing features and capabilities"
        },
        userPerspective: {
            type: "object",
            properties: {
                gui: {
                    type: "array",
                    items: { type: "string" },
                    description: "What users see and can do in the GUI"
                },
                cli: {
                    type: "array",
                    items: { type: "string" },
                    description: "CLI commands and what they accomplish"
                },
                api: {
                    type: "array",
                    items: { type: "string" },
                    description: "API endpoints and what external clients can do"
                },
                cicd: {
                    type: "array",
                    items: { type: "string" },
                    description: "CI/CD integration and workflow role"
                }
            },
            additionalProperties: false
        },
        workflowIntegration: {
            type: "array",
            items: { type: "string" },
            description: "Specific workflows this application supports"
        },
        problemsSolved: {
            type: "array",
            items: { type: "string" },
            description: "Specific problems this application solves for users"
        },
        architecture: {
            type: "string",
            description: "Architecture summary (2-3 paragraphs, high-level components and relationships, no file paths). If you need more information, use the requests field."
        },
        titles: {
            type: "array",
            items: { type: "string" },
            description: "Key titles/names of features, modules, components, and major functionality"
        },
        descriptions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    category: { 
                        type: "string",
                        enum: ["feature", "module", "component", "workflow", "integration", "other"]
                    }
                },
                required: ["title", "description"],
                additionalProperties: false
            },
            description: "Detailed descriptions of key features, modules, and components"
        },
        relevantFunctions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    file: { type: "string" },
                    module: { type: "string" }
                },
                required: ["name", "description"],
                additionalProperties: false
            },
            description: "Important functions, methods, or procedures with their purposes"
        },
        relevantDataStructures: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    type: {
                        type: "string",
                        enum: ["class", "interface", "type", "model", "schema", "struct", "other"]
                    },
                    file: { type: "string" }
                },
                required: ["name", "description"],
                additionalProperties: false
            },
            description: "Important data structures, classes, interfaces, models, or types"
        },
        relevantCodeFiles: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    path: { type: "string" },
                    description: { type: "string" },
                    purpose: { type: "string" },
                    role: { type: "string" }
                },
                required: ["path", "description", "purpose"],
                additionalProperties: false
            },
            description: "Important code files with their purposes and roles"
        },
        exampleInput: {
            type: "object",
            properties: {
                description: { 
                    type: "string",
                    description: "Description of what the example input represents"
                },
                json: {
                    type: "string",
                    description: "Example input JSON as a STRING. Provide compact JSON string without markdown fences."
                }
            },
            additionalProperties: false,
            description: "Example input data showing what actual data might flow through the application"
        },
        exampleOutput: {
            type: "object",
            properties: {
                description: { 
                    type: "string",
                    description: "Description of what the example output represents"
                },
                json: {
                    type: "string",
                    description: "Example output JSON as a STRING. Provide compact JSON string without markdown fences."
                }
            },
            additionalProperties: false,
            description: "Example output data showing what actual data the application might produce"
        },
        requests: {
            type: "array",
            items: {
                // oneOf unsupported by provider; use unified superset schema
                ...requestItemSchema
            },
            description: "Optional: Request specific files or grep searches to get more information. Use this if you need to examine specific code to provide better analysis. Maximum 5 requests per iteration."
        }
    },
    required: ["overview", "whatItDoes", "userPerspective", "workflowIntegration", "problemsSolved", "architecture", "titles", "descriptions", "relevantFunctions", "relevantDataStructures", "relevantCodeFiles"],
    additionalProperties: false
};


