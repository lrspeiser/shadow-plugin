/**
 * LLM Response Parser - Extracts structured data from LLM text responses
 * Handles parsing for all LLM response types
 */
import { FileSummary, ModuleSummary, EnhancedProductDocumentation } from '../fileDocumentation';
import { LLMInsights, ProductPurposeAnalysis } from '../llmService';
import { AnalysisContext } from '../llmService';

export class LLMResponseParser {
    /**
     * Parse file summary from LLM response
     */
    parseFileSummary(content: string, filePath: string, role: string): FileSummary {
        try {
            // Try to parse as JSON first
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    file: filePath,
                    role: role,
                    purpose: parsed.purpose || '',
                    userVisibleActions: parsed.userVisibleActions || [],
                    developerVisibleActions: parsed.developerVisibleActions || [],
                    keyFunctions: parsed.keyFunctions || [],
                    dependencies: parsed.dependencies || [],
                    intent: parsed.intent || '',
                    rawContent: content
                };
            }
        } catch (error) {
            console.error('Failed to parse file summary as JSON:', error);
        }

        // Fallback: extract from text
        return {
            file: filePath,
            role: role,
            purpose: this.extractSection(content, 'purpose') || 'Could not extract purpose',
            userVisibleActions: this.extractListSection(content, 'userVisibleActions') || [],
            developerVisibleActions: this.extractListSection(content, 'developerVisibleActions') || [],
            keyFunctions: [],
            dependencies: this.extractListSection(content, 'dependencies') || [],
            intent: this.extractSection(content, 'intent') || '',
            rawContent: content
        };
    }

    /**
     * Parse module summary from LLM response
     */
    parseModuleSummary(
        content: string,
        modulePath: string,
        moduleType: string,
        files: FileSummary[]
    ): ModuleSummary {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    module: modulePath,
                    moduleType: moduleType,
                    capabilities: parsed.capabilities || [],
                    summary: parsed.summary || '',
                    files: files,
                    endpoints: parsed.endpoints,
                    commands: parsed.commands,
                    workers: parsed.workers
                };
            }
        } catch (error) {
            console.error('Failed to parse module summary as JSON:', error);
        }

        return {
            module: modulePath,
            moduleType: moduleType,
            capabilities: this.extractListSection(content, 'capabilities') || [],
            summary: this.extractSection(content, 'summary') || '',
            files: files
        };
    }

    /**
     * Parse product documentation from LLM response
     */
    parseProductDocs(content: string): any {
        // Simple parsing - extract sections
        const sections: any = {
            overview: '',
            features: [],
            architecture: '',
            techStack: [],
            apiEndpoints: [],
            dataModels: [],
            userFlows: [],
            rawContent: content // Store raw content as fallback
        };

        // Extract overview - try multiple patterns
        const overviewPatterns = [
            /(?:Product Overview|Overview|## Overview|# Overview)[:\n\s]+(.*?)(?=\n##|\n#|$)/is,
            /(?:^|\n)(.*?)(?=\n##|$)/s, // First paragraph if no section header
            /^(.+?)(?=\n\n|$)/s // Very first line/paragraph
        ];
        
        for (const pattern of overviewPatterns) {
            const match = content.match(pattern);
            if (match && match[1] && match[1].trim().length > 20) {
                sections.overview = match[1].trim();
                break;
            }
        }

        // Extract features (bullet points under Features section)
        const featuresPatterns = [
            /(?:Key Features|Features|## Features|# Features)[:\n\s]+((?:[-•*]\s+.+?\n)+)/is,
            /(?:Key Features|Features)[:\n\s]+(.*?)(?=\n##|\n#|$)/is
        ];
        
        for (const pattern of featuresPatterns) {
            const featuresMatch = content.match(pattern);
            if (featuresMatch) {
                const featuresText = featuresMatch[1];
                sections.features = featuresText
                    .split('\n')
                    .filter(l => l.trim().match(/^[-•*\d]/))
                    .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
                    .filter(l => l.length > 0);
                if (sections.features.length > 0) break;
            }
        }

        sections.architecture = this.extractSection(content, 'Architecture') || 
                               this.extractSection(content, 'Architecture Overview') || '';
        sections.techStack = this.extractListSection(content, 'Tech Stack') || 
                            this.extractListSection(content, 'Technology Stack') || [];
        sections.apiEndpoints = this.extractListSection(content, 'API Endpoints') || [];
        sections.dataModels = this.extractListSection(content, 'Data Models') || [];
        sections.userFlows = this.extractListSection(content, 'User Flows') || [];

        return sections;
    }

    /**
     * Parse product level documentation
     */
    parseProductLevelDoc(
        content: string,
        fileSummaries: FileSummary[],
        moduleSummaries: ModuleSummary[]
    ): EnhancedProductDocumentation {
        return {
            overview: this.extractSection(content, 'Product Overview') || '',
            whatItDoes: this.extractListSection(content, 'What It Does') || [],
            userPerspective: {
                gui: this.extractListSection(content, 'GUI') || [],
                cli: this.extractListSection(content, 'CLI') || [],
                api: this.extractListSection(content, 'API') || [],
                cicd: this.extractListSection(content, 'CI/CD') || []
            },
            workflowIntegration: this.extractListSection(content, 'Workflow Integration') || [],
            problemsSolved: this.extractListSection(content, 'Problems Solved') || [],
            architecture: this.extractSection(content, 'Architecture Summary') || '',
            modules: moduleSummaries,
            fileSummaries: fileSummaries,
            rawContent: content
        };
    }

    /**
     * Parse architecture insights from LLM response
     */
    parseArchitectureInsights(content: string, context: AnalysisContext): LLMInsights {
        console.log('Parsing LLM response, length:', content.length);
        console.log('First 1000 chars:', content.substring(0, 1000));
        
        // Try multiple variations of section names
        const insights: LLMInsights = {
            overallAssessment: this.extractSection(content, 'Overall Architecture Assessment') || 
                              this.extractSection(content, 'Architecture Assessment') ||
                              this.extractSection(content, 'Overall Assessment') ||
                              this.extractSection(content, 'Overall') || '',
            strengths: this.extractListSection(content, 'Strengths') || [],
            issues: this.extractListSection(content, 'Issues & Concerns') ||
                   this.extractListSection(content, 'Issues') || 
                   this.extractListSection(content, 'Concerns') || [],
            organization: this.extractSection(content, 'Code Organization') || 
                         this.extractSection(content, 'Organization') ||
                         this.extractSection(content, 'File Organization') || '',
            entryPointsAnalysis: this.extractSection(content, 'Entry Points') || 
                               this.extractSection(content, 'Entry Points Analysis') || '',
            orphanedFilesAnalysis: this.extractSection(content, 'Orphaned Files') || 
                                  this.extractSection(content, 'Orphaned Files Analysis') || '',
            folderReorganization: this.extractSection(content, 'Folder Reorganization') || 
                                 this.extractSection(content, 'Reorganization') ||
                                 this.extractSection(content, 'Folder Reorganization Plan') || '',
            recommendations: this.parseStructuredItems(content, 'Recommendations') || [],
            priorities: this.parseStructuredItems(content, 'Refactoring Priorities', 'Priorities', 'Refactoring') || []
        };

        console.log('Parsed insights:', {
            hasOverall: !!insights.overallAssessment,
            strengthsCount: insights.strengths.length,
            issuesCount: insights.issues.length,
            hasOrganization: !!insights.organization,
            hasReorganization: !!insights.folderReorganization,
            recommendationsCount: insights.recommendations.length,
            prioritiesCount: insights.priorities.length
        });

        // If parsing failed completely, try a more aggressive approach
        const hasAnyContent = insights.overallAssessment || 
                             insights.strengths.length > 0 ||
                             insights.issues.length > 0 ||
                             insights.organization ||
                             insights.folderReorganization ||
                             insights.recommendations.length > 0 ||
                             insights.priorities.length > 0;
        
        if (!hasAnyContent && content.length > 100) {
            console.warn('⚠️ Parsing failed - no content extracted. Raw content available as fallback.');
            // Try to extract at least the first paragraph as overall assessment
            const firstParagraph = content.split('\n\n').find(p => p.trim().length > 50);
            if (firstParagraph) {
                insights.overallAssessment = firstParagraph.trim();
                console.log('Extracted first paragraph as overall assessment');
            }
        }

        // Store raw content as fallback
        insights.rawContent = content;

        return insights;
    }

    /**
     * Parse product purpose analysis
     */
    parseProductPurposeAnalysis(content: string): ProductPurposeAnalysis {
        return {
            productPurpose: this.extractSection(content, 'Product Purpose') || '',
            architectureRationale: this.extractSection(content, 'Architecture Rationale') || '',
            designDecisions: this.extractListSection(content, 'Key Design Decisions') || [],
            userGoals: this.extractListSection(content, 'User Goals') || [],
            contextualFactors: this.extractListSection(content, 'Contextual Factors') || []
        };
    }

    /**
     * Extract a section from markdown/text content
     */
    private extractSection(content: string, sectionName: string): string {
        // Escape special regex characters in section name
        const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Try multiple patterns - be more flexible with whitespace and newlines
        const patterns = [
            // Markdown headers with ## (most common)
            new RegExp(`##\\s+${escapedName}\\s*\\n+([\\s\\S]*?)(?=\\n##|$)`, 'i'),
            // Markdown headers with #
            new RegExp(`#\\s+${escapedName}\\s*\\n+([\\s\\S]*?)(?=\\n#|$)`, 'i'),
            // Markdown headers with ###
            new RegExp(`###\\s+${escapedName}\\s*\\n+([\\s\\S]*?)(?=\\n###|\\n##|\\n#|$)`, 'i'),
            // Markdown headers with colon
            new RegExp(`##\\s+${escapedName}\\s*[:]\\s*\\n+([\\s\\S]*?)(?=\\n##|$)`, 'i'),
            // Bold text
            new RegExp(`\\*\\*${escapedName}\\*\\*\\s*[:]?\\s*\\n+([\\s\\S]*?)(?=\\n\\*\\*|\\n##|\\n#|$)`, 'i'),
            // Numbered sections
            new RegExp(`\\d+\\.\\s*${escapedName}\\s*[:]?\\s*\\n+([\\s\\S]*?)(?=\\n\\d+\\.|\\n##|\\n#|$)`, 'i')
        ];
        
        for (const regex of patterns) {
            const match = content.match(regex);
            if (match && match[1]) {
                const extracted = match[1].trim();
                // Remove any trailing markdown headers that might have been captured
                const cleaned = extracted.replace(/\n##\s+.*$/s, '').trim();
                if (cleaned.length > 10) { // Only return if substantial content
                    return cleaned;
                }
            }
        }
        
        return '';
    }

    /**
     * Extract a list section from markdown/text content
     */
    private extractListSection(content: string, sectionName: string): string[] {
        const section = this.extractSection(content, sectionName);
        if (!section) {
            console.log(`No section found for: ${sectionName}`);
            return [];
        }
        
        console.log(`Extracting list from section "${sectionName}", content length: ${section.length}`);
        console.log(`First 500 chars: ${section.substring(0, 500)}`);
        
        // Special handling for "Issues & Concerns" to ensure we capture Proposed Fix content
        const isIssuesSection = sectionName.includes('Issues') || sectionName.includes('Concerns');
        
        // Extract list items - handle multi-line items
        const items: string[] = [];
        
        // Split by lines and look for list markers
        const lines = section.split('\n');
        let currentItem: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Check if this line starts a new list item
            const isListItemStart = trimmed.match(/^[-•*]\s+/) || 
                                    trimmed.match(/^\d+[.)]\s+/) || 
                                    trimmed.match(/^[-•*]\s/) ||
                                    trimmed.match(/^[•]\s/);
            
            if (isListItemStart) {
                // Save previous item if it exists
                if (currentItem.length > 0) {
                    let fullItem = currentItem.join('\n').trim();
                    // Remove leading bullet/number marker
                    fullItem = fullItem.replace(/^[-•*\d.)]\s+/, '').trim();
                    
                    // For issues section, validate that Proposed Fix has content
                    if (isIssuesSection && fullItem.includes('**Proposed Fix**:')) {
                        const fixMatch = fullItem.match(/\*\*Proposed Fix\*\*:\s*(.+)/s);
                        if (!fixMatch || !fixMatch[1] || fixMatch[1].trim().length < 10) {
                            console.warn(`Issue found with empty or very short Proposed Fix: ${fullItem.substring(0, 200)}`);
                        }
                    }
                    
                    if (fullItem.length > 0) {
                        items.push(fullItem);
                    }
                }
                // Start new item
                currentItem = [trimmed];
            } else if (trimmed.length > 0 && currentItem.length > 0) {
                // Continuation of current item
                currentItem.push(trimmed);
            }
        }
        
        // Don't forget the last item
        if (currentItem.length > 0) {
            let fullItem = currentItem.join('\n').trim();
            fullItem = fullItem.replace(/^[-•*\d.)]\s+/, '').trim();
            
            if (isIssuesSection && fullItem.includes('**Proposed Fix**:')) {
                const fixMatch = fullItem.match(/\*\*Proposed Fix\*\*:\s*(.+)/s);
                if (!fixMatch || !fixMatch[1] || fixMatch[1].trim().length < 10) {
                    console.warn(`Issue found with empty or very short Proposed Fix: ${fullItem.substring(0, 200)}`);
                }
            }
            
            if (fullItem.length > 0) {
                items.push(fullItem);
            }
        }
        
        console.log(`Extracted ${items.length} items from section "${sectionName}"`);
        return items;
    }

    /**
     * Parse structured items (issues, recommendations, priorities) from OpenAI responses
     * Falls back to simple string array if structured format not found
     */
    private parseStructuredItems(content: string, ...sectionNames: string[]): any[] {
        const section = sectionNames
            .map(name => this.extractSection(content, name))
            .find(s => s && s.length > 0);
        
        if (!section) {
            // Fallback to simple list extraction
            return this.extractListSection(content, sectionNames[0]) || [];
        }

        // Try to parse structured format
        const items: any[] = [];
        const lines = section.split('\n');
        let currentItem: Partial<any> | null = null;

        for (const line of lines) {
            const trimmed = line.trim();
            
            // Check for title/description pattern
            if (trimmed.match(/^[-•*]\s+(.+?):\s*(.+)$/)) {
                const match = trimmed.match(/^[-•*]\s+(.+?):\s*(.+)$/);
                if (match) {
                    if (currentItem) {
                        items.push(currentItem);
                    }
                    currentItem = {
                        title: match[1].trim(),
                        description: match[2].trim()
                    };
                }
            } else if (trimmed.match(/^\*\*Title\*\*:\s*(.+)$/i)) {
                const match = trimmed.match(/^\*\*Title\*\*:\s*(.+)$/i);
                if (match) {
                    if (currentItem) {
                        items.push(currentItem);
                    }
                    currentItem = {
                        title: match[1].trim(),
                        description: ''
                    };
                }
            } else if (trimmed.match(/^\*\*Description\*\*:\s*(.+)$/i)) {
                const match = trimmed.match(/^\*\*Description\*\*:\s*(.+)$/i);
                if (match && currentItem) {
                    currentItem.description = match[1].trim();
                }
            } else if (trimmed.match(/^\*\*Files\*\*:\s*(.+)$/i)) {
                const match = trimmed.match(/^\*\*Files\*\*:\s*(.+)$/i);
                if (match && currentItem) {
                    currentItem.relevantFiles = match[1].split(',').map(f => f.trim());
                }
            } else if (trimmed.match(/^\*\*Functions\*\*:\s*(.+)$/i)) {
                const match = trimmed.match(/^\*\*Functions\*\*:\s*(.+)$/i);
                if (match && currentItem) {
                    currentItem.relevantFunctions = match[1].split(',').map(f => f.trim());
                }
            } else if (trimmed.length > 0 && currentItem) {
                // Continuation of description
                if (currentItem.description) {
                    currentItem.description += '\n' + trimmed;
                } else {
                    currentItem.description = trimmed;
                }
            }
        }

        // Don't forget the last item
        if (currentItem) {
            items.push(currentItem);
        }

        // If we didn't find structured items, fall back to simple list
        if (items.length === 0) {
            return this.extractListSection(content, sectionNames[0]) || [];
        }

        return items;
    }
}

