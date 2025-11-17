import Anthropic from '@anthropic-ai/sdk';

// Inline schema mirroring llmInsightsSchema with provider-safe constraints
const llmInsightsSchema = {
    type: "object",
    properties: {
        overallAssessment: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        issues: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    relevantFiles: { type: "array", items: { type: "string" } },
                    relevantFunctions: { type: "array", items: { type: "string" } }
                },
                required: ["title", "description"],
                additionalProperties: false
            }
        },
        organization: { type: "string" },
        entryPointsAnalysis: { type: "string" },
        orphanedFilesAnalysis: { type: "string" },
        folderReorganization: { type: "string" },
        recommendations: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    relevantFiles: { type: "array", items: { type: "string" } },
                    relevantFunctions: { type: "array", items: { type: "string" } }
                },
                required: ["title", "description"],
                additionalProperties: false
            }
        },
        priorities: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    relevantFiles: { type: "array", items: { type: "string" } },
                    relevantFunctions: { type: "array", items: { type: "string" } }
                },
                required: ["title", "description"],
                additionalProperties: false
            }
        },
        cursorPrompt: { type: "string" },
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
    required: [
        "overallAssessment",
        "strengths",
        "issues",
        "organization",
        "entryPointsAnalysis",
        "orphanedFilesAnalysis",
        "folderReorganization",
        "recommendations",
        "priorities"
    ],
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
            content: [
                "Analyze this tiny fake project and provide architecture insights per schema.",
                "",
                "Project summary:",
                "- Files: main.py (prints hello), utils.py (formatting helper)",
                "- Entry: main.py",
                "- No dependencies",
                "",
                "Please keep responses short but valid per schema."
            ].join("\n")
        }
    ];

    try {
        const resp = await client.beta.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 2000,
            betas: ['structured-outputs-2025-11-13'],
            system: 'You generate structured architecture insights as valid JSON per the provided schema.',
            messages,
            output_format: {
                type: 'json_schema',
                schema: llmInsightsSchema
            }
        });

        const text = resp?.content?.[0]?.text || '';
        if (!text) {
            console.error('Empty response content from API.');
            process.exit(1);
        }
        const parsed = JSON.parse(text);
        console.log('OK - Received valid insights with keys:', Object.keys(parsed));
        console.log('Counts:', {
            strengths: parsed.strengths?.length ?? 0,
            issues: parsed.issues?.length ?? 0,
            recommendations: parsed.recommendations?.length ?? 0,
            priorities: parsed.priorities?.length ?? 0
        });
        process.exit(0);
    } catch (err) {
        console.error('API call failed:', err?.response?.data || err?.message || err);
        process.exit(1);
    }
}

main();


