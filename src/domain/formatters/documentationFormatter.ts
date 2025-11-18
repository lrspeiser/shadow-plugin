/**
 * Documentation Formatter
 * Formats domain objects (product docs, insights) as Markdown
 * Extracted from llmIntegration.ts to separate formatting concerns
 */
import { EnhancedProductDocumentation } from '../../fileDocumentation';
import { LLMInsights } from '../../llmService';

export class DocumentationFormatter {
    /**
     * Format enhanced product documentation as Markdown
     */
    formatEnhancedDocsAsMarkdown(docs: EnhancedProductDocumentation): string {
        const now = new Date();
        const dateStamp = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        const localDateStamp = now.toLocaleString();
        
        let md = '# Product Documentation\n\n';
        md += `*Generated: ${localDateStamp} (${dateStamp})*\n\n`;
        md += '---\n\n';

        // Product Overview
        if (docs.overview) {
            md += `## Product Overview\n\n${docs.overview}\n\n`;
        }

        // What It Does
        if (docs.whatItDoes && docs.whatItDoes.length > 0) {
            md += `## What It Does\n\n`;
            docs.whatItDoes.forEach(feature => md += `- ${feature}\n`);
            md += '\n';
        }

        // User Perspective
        if (docs.userPerspective) {
            md += `## User Perspective\n\n`;
            if (docs.userPerspective.gui && docs.userPerspective.gui.length > 0) {
                md += `### GUI\n\n`;
                docs.userPerspective.gui.forEach(item => md += `- ${item}\n`);
                md += '\n';
            }
            if (docs.userPerspective.cli && docs.userPerspective.cli.length > 0) {
                md += `### CLI\n\n`;
                docs.userPerspective.cli.forEach(item => md += `- ${item}\n`);
                md += '\n';
            }
            if (docs.userPerspective.api && docs.userPerspective.api.length > 0) {
                md += `### API\n\n`;
                docs.userPerspective.api.forEach(item => md += `- ${item}\n`);
                md += '\n';
            }
            if (docs.userPerspective.cicd && docs.userPerspective.cicd.length > 0) {
                md += `### CI/CD\n\n`;
                docs.userPerspective.cicd.forEach(item => md += `- ${item}\n`);
                md += '\n';
            }
        }

        // Workflow Integration
        if (docs.workflowIntegration && docs.workflowIntegration.length > 0) {
            md += `## Workflow Integration\n\n`;
            docs.workflowIntegration.forEach(workflow => md += `- ${workflow}\n`);
            md += '\n';
        }

        // Problems Solved
        if (docs.problemsSolved && docs.problemsSolved.length > 0) {
            md += `## Problems Solved\n\n`;
            docs.problemsSolved.forEach(problem => md += `- ${problem}\n`);
            md += '\n';
        }

        // Architecture Summary
        if (docs.architecture) {
            md += `## Architecture Summary\n\n${docs.architecture}\n\n`;
        }

        // Module Documentation
        if (docs.modules && docs.modules.length > 0) {
            md += `## Module Documentation\n\n`;
            for (const module of docs.modules) {
                md += `### ${module.module} (${module.moduleType})\n\n`;
                if (module.summary) {
                    md += `${module.summary}\n\n`;
                }
                if (module.capabilities && module.capabilities.length > 0) {
                    md += `**Capabilities:**\n`;
                    module.capabilities.forEach(cap => md += `- ${cap}\n`);
                    md += '\n';
                }
                if (module.endpoints && module.endpoints.length > 0) {
                    md += `**Endpoints:**\n`;
                    module.endpoints.forEach(ep => {
                        const method = ep.method ? `${ep.method} ` : '';
                        md += `- ${method}${ep.path}: ${ep.description}\n`;
                    });
                    md += '\n';
                }
                if (module.commands && module.commands.length > 0) {
                    md += `**Commands:**\n`;
                    module.commands.forEach(cmd => md += `- \`${cmd.command}\`: ${cmd.description}\n`);
                    md += '\n';
                }
                if (module.workers && module.workers.length > 0) {
                    md += `**Workers:**\n`;
                    module.workers.forEach(worker => {
                        md += `- ${worker.name}: ${worker.description}\n`;
                        if (worker.jobFlow) {
                            md += `  - Flow: ${worker.jobFlow}\n`;
                        }
                    });
                    md += '\n';
                }
            }
        }

        // File-Level Documentation (Appendix)
        if (docs.fileSummaries && docs.fileSummaries.length > 0) {
            md += `## File-Level Documentation\n\n`;
            md += `*Detailed documentation for ${docs.fileSummaries.length} files*\n\n`;
            for (const file of docs.fileSummaries.slice(0, 20)) { // Limit to first 20 for readability
                md += `### ${file.file}\n\n`;
                md += `**Role:** ${file.role}\n\n`;
                if (file.purpose) {
                    md += `**Purpose:** ${file.purpose}\n\n`;
                }
                if (file.userVisibleActions && file.userVisibleActions.length > 0) {
                    md += `**User Actions:**\n`;
                    file.userVisibleActions.forEach(action => md += `- ${action}\n`);
                    md += '\n';
                }
                if (file.keyFunctions && file.keyFunctions.length > 0) {
                    md += `**Key Functions:**\n`;
                    file.keyFunctions.forEach(func => {
                        md += `- \`${func.name}\`: ${func.desc}\n`;
                        if (func.inputs) md += `  - Inputs: ${func.inputs}\n`;
                        if (func.outputs) md += `  - Outputs: ${func.outputs}\n`;
                    });
                    md += '\n';
                }
            }
            if (docs.fileSummaries.length > 20) {
                md += `\n*... and ${docs.fileSummaries.length - 20} more files*\n`;
            }
        }

        return md;
    }

    /**
     * Format architecture insights as Markdown
     */
    formatInsightsAsMarkdown(insights: LLMInsights): string {
        const now = new Date();
        const dateStamp = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        const localDateStamp = now.toLocaleString();
        
        let md = '# AI Architecture Insights\n\n';
        md += `*Generated: ${localDateStamp} (${dateStamp})*\n\n`;
        md += '---\n\n';
        
        if (insights.overallAssessment) {
            md += `## Overall Architecture Assessment\n\n${insights.overallAssessment}\n\n`;
        }

        if (insights.strengths && insights.strengths.length > 0) {
            md += `## Strengths\n\n`;
            insights.strengths.forEach(s => md += `- ${s}\n`);
            md += '\n';
        }

        if (insights.issues && insights.issues.length > 0) {
            md += `## Issues & Concerns\n\n`;
            insights.issues.forEach(i => {
                if (typeof i === 'string') {
                    md += `- ${i}\n`;
                } else {
                    md += `- **${i.title}**: ${i.description}\n`;
                    if (i.relevantFiles && i.relevantFiles.length > 0) {
                        md += `  - Files: ${i.relevantFiles.join(', ')}\n`;
                    }
                    if (i.relevantFunctions && i.relevantFunctions.length > 0) {
                        md += `  - Functions: ${i.relevantFunctions.join(', ')}\n`;
                    }
                }
            });
            md += '\n';
        }

        if (insights.organization) {
            md += `## Code Organization\n\n${insights.organization}\n\n`;
        }

        if (insights.entryPointsAnalysis) {
            md += `## Entry Points Analysis\n\n${insights.entryPointsAnalysis}\n\n`;
        }

        if (insights.orphanedFilesAnalysis) {
            md += `## Orphaned Files Analysis\n\n${insights.orphanedFilesAnalysis}\n\n`;
        }

        if (insights.folderReorganization) {
            md += `## Folder Reorganization Suggestions\n\n${insights.folderReorganization}\n\n`;
        }

        if (insights.recommendations && insights.recommendations.length > 0) {
            md += `## Recommendations\n\n`;
            insights.recommendations.forEach(r => {
                if (typeof r === 'string') {
                    md += `- ${r}\n`;
                } else {
                    md += `- **${r.title}**: ${r.description}\n`;
                    if (r.relevantFiles && r.relevantFiles.length > 0) {
                        md += `  - Files: ${r.relevantFiles.join(', ')}\n`;
                    }
                    if (r.relevantFunctions && r.relevantFunctions.length > 0) {
                        md += `  - Functions: ${r.relevantFunctions.join(', ')}\n`;
                    }
                }
            });
            md += '\n';
        }

        if (insights.priorities && insights.priorities.length > 0) {
            md += `## Refactoring Priorities\n\n`;
            insights.priorities.forEach(p => {
                if (typeof p === 'string') {
                    md += `- ${p}\n`;
                } else {
                    md += `- **${p.title}**: ${p.description}\n`;
                    if (p.relevantFiles && p.relevantFiles.length > 0) {
                        md += `  - Files: ${p.relevantFiles.join(', ')}\n`;
                    }
                    if (p.relevantFunctions && p.relevantFunctions.length > 0) {
                        md += `  - Functions: ${p.relevantFunctions.join(', ')}\n`;
                    }
                }
            });
            md += '\n';
        }

        if (insights.cursorPrompt) {
            md += `---\n\n## LLM Refactoring Prompt\n\n\`\`\`\n${insights.cursorPrompt}\n\`\`\`\n`;
        }

        return md;
    }
}

