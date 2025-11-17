import { Insight } from './insightGenerator';

export class LLMFormatter {
    formatInsights(insights: Insight[], format: string = 'cursor'): string {
        switch (format.toLowerCase()) {
            case 'cursor':
                return this.formatForCursor(insights);
            case 'chatgpt':
                return this.formatForChatGPT(insights);
            case 'compact':
                return this.formatCompact(insights);
            case 'generic':
            default:
                return this.formatGeneric(insights);
        }
    }

    private formatForCursor(insights: Insight[]): string {
        let output = '# Code Architecture Issues\n\n';
        output += `I have ${insights.length} architecture issues that need attention:\n\n`;

        // Group by severity
        const errors = insights.filter(i => i.severity === 'error');
        const warnings = insights.filter(i => i.severity === 'warning');
        const infos = insights.filter(i => i.severity === 'info');

        if (errors.length > 0) {
            output += '## 🔴 Critical Issues (Errors)\n\n';
            for (const insight of errors) {
                output += this.formatInsightForCursor(insight);
            }
        }

        if (warnings.length > 0) {
            output += '## ⚠️ Warnings\n\n';
            for (const insight of warnings) {
                output += this.formatInsightForCursor(insight);
            }
        }

        if (infos.length > 0) {
            output += '## ℹ️ Informational\n\n';
            for (const insight of infos) {
                output += this.formatInsightForCursor(insight);
            }
        }

        output += '\n## 💡 What I Need\n\n';
        output += 'Please help me address these issues:\n';
        output += '1. Prioritize which issues to tackle first\n';
        output += '2. Provide specific refactoring steps for the critical issues\n';
        output += '3. Suggest a codebase reorganization plan if needed\n';
        output += '4. Generate refactored code examples for the main problems\n';

        return output;
    }

    private formatInsightForCursor(insight: Insight): string {
        let text = `### ${insight.title}\n\n`;
        text += `**Category:** ${insight.category}\n\n`;
        text += `**Description:** ${insight.description}\n\n`;
        
        if (insight.file) {
            text += `**File:** \`${insight.file}\``;
            if (insight.line) {
                text += ` (line ${insight.line})`;
            }
            text += '\n\n';
        }

        text += `**Suggestion:** ${insight.suggestion}\n\n`;

        if (insight.codeSnippet) {
            text += '**Code:**\n```\n' + insight.codeSnippet + '\n```\n\n';
        }

        text += '---\n\n';
        return text;
    }

    private formatForChatGPT(insights: Insight[]): string {
        let output = '# Code Architecture Analysis Results\n\n';
        output += 'I\'ve analyzed my codebase and found several architectural issues that need attention. ';
        output += 'Could you help me understand the implications and create a plan to address them?\n\n';

        output += `## Summary\n\n`;
        output += `- Total Issues: ${insights.length}\n`;
        output += `- Critical (Errors): ${insights.filter(i => i.severity === 'error').length}\n`;
        output += `- Warnings: ${insights.filter(i => i.severity === 'warning').length}\n`;
        output += `- Informational: ${insights.filter(i => i.severity === 'info').length}\n\n`;

        // Group by category
        const byCategory = this.groupByCategory(insights);

        output += '## Issues by Category\n\n';
        for (const [category, categoryInsights] of Object.entries(byCategory)) {
            output += `### ${category} (${categoryInsights.length} issues)\n\n`;
            
            for (const insight of categoryInsights) {
                output += `**${insight.title}** (${this.severityEmoji(insight.severity)})\n`;
                output += `- ${insight.description}\n`;
                
                if (insight.file) {
                    output += `- Location: \`${insight.file}\`${insight.line ? `:${insight.line}` : ''}\n`;
                }
                
                output += `- Recommendation: ${insight.suggestion}\n\n`;
            }
        }

        output += '## Questions\n\n';
        output += '1. Which of these issues should I prioritize based on impact?\n';
        output += '2. Are there any architectural patterns I should apply to solve multiple issues at once?\n';
        output += '3. Could you provide a step-by-step refactoring plan?\n';
        output += '4. Are there any quick wins I can implement immediately?\n';

        return output;
    }

    private formatGeneric(insights: Insight[]): string {
        let output = '# Architecture Insights\n\n';

        for (const insight of insights) {
            output += `## ${this.severityEmoji(insight.severity)} ${insight.title}\n\n`;
            output += `**Severity:** ${insight.severity.toUpperCase()}  \n`;
            output += `**Category:** ${insight.category}\n\n`;
            output += `${insight.description}\n\n`;
            
            if (insight.file) {
                output += `**Location:** \`${insight.file}\``;
                if (insight.line) output += ` line ${insight.line}`;
                output += '\n\n';
            }

            output += `**💡 Suggestion:** ${insight.suggestion}\n\n`;
            
            if (insight.codeSnippet) {
                output += '```\n' + insight.codeSnippet + '\n```\n\n';
            }

            output += '---\n\n';
        }

        return output;
    }

    private formatCompact(insights: Insight[]): string {
        let output = '# Quick Architecture Issues\n\n';

        const errors = insights.filter(i => i.severity === 'error');
        const warnings = insights.filter(i => i.severity === 'warning');

        if (errors.length > 0) {
            output += '**Critical Issues:**\n';
            for (const insight of errors) {
                output += `- ${insight.title}: ${insight.description}\n`;
                if (insight.file) output += `  → \`${insight.file}\`\n`;
            }
            output += '\n';
        }

        if (warnings.length > 0) {
            output += '**Warnings:**\n';
            for (const insight of warnings) {
                output += `- ${insight.title}`;
                if (insight.file) output += ` in \`${insight.file}\``;
                output += '\n';
            }
            output += '\n';
        }

        output += '\n**Top Recommendations:**\n';
        for (const insight of insights.slice(0, 5)) {
            output += `- ${insight.suggestion}\n`;
        }

        return output;
    }

    private severityEmoji(severity: string): string {
        switch (severity) {
            case 'error': return '🔴';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '•';
        }
    }

    private groupByCategory(insights: Insight[]): { [key: string]: Insight[] } {
        const grouped: { [key: string]: Insight[] } = {};

        for (const insight of insights) {
            if (!grouped[insight.category]) {
                grouped[insight.category] = [];
            }
            grouped[insight.category].push(insight);
        }

        return grouped;
    }

    // Format a single insight for copying
    formatSingleInsight(insight: Insight, format: string = 'cursor'): string {
        return this.formatInsights([insight], format);
    }

    // Generate a prompt for a specific fix
    generateFixPrompt(insight: Insight, codeContext?: string): string {
        let prompt = `# Fix Request: ${insight.title}\n\n`;
        prompt += `## Problem\n${insight.description}\n\n`;
        prompt += `## Suggestion\n${insight.suggestion}\n\n`;

        if (insight.file) {
            prompt += `## Location\n`;
            prompt += `File: \`${insight.file}\`\n`;
            if (insight.line) {
                prompt += `Line: ${insight.line}\n`;
            }
            prompt += '\n';
        }

        if (codeContext) {
            prompt += `## Current Code\n\`\`\`\n${codeContext}\n\`\`\`\n\n`;
        }

        prompt += `## Request\n`;
        prompt += `Please provide:\n`;
        prompt += `1. A detailed explanation of why this is a problem\n`;
        prompt += `2. Step-by-step refactoring instructions\n`;
        prompt += `3. Refactored code that addresses the issue\n`;
        prompt += `4. Any additional considerations or best practices\n`;

        return prompt;
    }

    // Generate a comprehensive architecture improvement prompt
    generateArchitecturePrompt(insights: Insight[], projectContext?: string): string {
        let prompt = `# Architecture Improvement Plan Request\n\n`;
        
        if (projectContext) {
            prompt += `## Project Context\n${projectContext}\n\n`;
        }

        prompt += `## Current Issues\n\n`;
        prompt += `I've identified ${insights.length} architectural issues in my codebase:\n\n`;

        // Summarize by category
        const byCategory = this.groupByCategory(insights);
        for (const [category, items] of Object.entries(byCategory)) {
            prompt += `**${category}:** ${items.length} issues\n`;
        }

        prompt += '\n';

        // List critical issues
        const critical = insights.filter(i => i.severity === 'error');
        if (critical.length > 0) {
            prompt += `### Critical Issues\n\n`;
            for (const insight of critical) {
                prompt += `- ${insight.title}: ${insight.description}\n`;
            }
            prompt += '\n';
        }

        prompt += `## What I Need\n\n`;
        prompt += `Please help me create a comprehensive architecture improvement plan:\n\n`;
        prompt += `1. **Assessment**: Analyze the overall health of the codebase based on these issues\n`;
        prompt += `2. **Priorities**: Rank the issues by impact and effort required\n`;
        prompt += `3. **Quick Wins**: Identify easy improvements I can make immediately\n`;
        prompt += `4. **Refactoring Plan**: Provide a phased approach to address major issues\n`;
        prompt += `5. **Best Practices**: Suggest patterns and practices to prevent future issues\n`;
        prompt += `6. **Code Examples**: Show concrete examples of refactored code for key issues\n\n`;

        prompt += `## Detailed Issues\n\n`;
        for (const insight of insights) {
            prompt += `### ${insight.title} (${insight.severity})\n`;
            prompt += `- **Category**: ${insight.category}\n`;
            prompt += `- **Description**: ${insight.description}\n`;
            if (insight.file) {
                prompt += `- **File**: \`${insight.file}\`\n`;
            }
            prompt += `- **Suggestion**: ${insight.suggestion}\n\n`;
        }

        return prompt;
    }
}

