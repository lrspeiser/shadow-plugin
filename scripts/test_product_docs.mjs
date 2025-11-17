import Anthropic from '@anthropic-ai/sdk';

// Inline schema (mirrors productDocumentationSchema used by the extension)
const productDocumentationSchema = {
    type: "object",
    properties: {
        overview: { type: "string" },
        whatItDoes: { type: "array", items: { type: "string" } },
        userPerspective: {
            type: "object",
            properties: {
                gui: { type: "array", items: { type: "string" } },
                cli: { type: "array", items: { type: "string" } },
                api: { type: "array", items: { type: "string" } },
                cicd: { type: "array", items: { type: "string" } }
            },
            additionalProperties: false
        },
        workflowIntegration: { type: "array", items: { type: "string" } },
        problemsSolved: { type: "array", items: { type: "string" } },
        architecture: { type: "string" },
        titles: { type: "array", items: { type: "string" } },
        descriptions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string", enum: ["feature", "module", "component", "workflow", "integration", "other"] }
                },
                required: ["title", "description"],
                additionalProperties: false
            }
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
            }
        },
        relevantDataStructures: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    type: { type: "string", enum: ["class", "interface", "type", "model", "schema", "struct", "other"] },
                    file: { type: "string" }
                },
                required: ["name", "description"],
                additionalProperties: false
            }
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
            }
        },
        exampleInput: {
            type: "object",
            properties: {
                description: { type: "string" },
                json: { type: "string" }
            },
            additionalProperties: false
        },
        exampleOutput: {
            type: "object",
            properties: {
                description: { type: "string" },
                json: { type: "string" }
            },
            additionalProperties: false
        },
        requests: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    type: { type: "string", enum: ["file", "grep"] },
                    path: { type: "string" },
                    pattern: { type: "string" },
                    filePattern: { type: "string" },
                    maxResults: { type: "number" },
                    reason: { type: "string" }
                },
                required: ["type"],
                additionalProperties: false
            }
        }
    },
    required: ["overview", "whatItDoes", "userPerspective", "workflowIntegration", "problemsSolved", "architecture", "titles", "descriptions", "relevantFunctions", "relevantDataStructures", "relevantCodeFiles"],
    additionalProperties: false
};

async function main() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
        console.error('Missing ANTHROPIC_API_KEY (or CLAUDE_API_KEY) in environment.');
        process.exit(2);
    }

    const client = new Anthropic({
        apiKey,
        timeout: 120000
    });

    const messages = [
        {
            role: 'user',
            content: 'Generate minimal product documentation for a fake app named "HelloWorld". Features: greet user, show time. Keep it concise but valid.'
        }
    ];

    try {
        const resp = await client.beta.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 2000,
            betas: ['structured-outputs-2025-11-13'],
            system: 'You generate structured product documentation as valid JSON per the provided schema.',
            messages,
            output_format: {
                type: 'json_schema',
                schema: productDocumentationSchema
            }
        });

        const text = resp?.content?.[0]?.text || '';
        if (!text) {
            console.error('Empty response content from API.');
            process.exit(1);
        }
        const parsed = JSON.parse(text);
        console.log('OK - Received valid structured output with keys:', Object.keys(parsed));
        process.exit(0);
    } catch (err) {
        console.error('API call failed:', err?.response?.data || err?.message || err);
        process.exit(1);
    }
}

main();


