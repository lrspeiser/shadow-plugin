/**
 * LLM-based test planning service
 * Phase 2: Analyze functions and create prioritized test plan
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestPlan, TestableFunction } from './types/testPlanTypes';
import { buildPlanningPrompt } from '../../prompts/testPrompts';
import { CodeAnalysis } from '../../../analyzer';
import { SWLogger } from '../../../logger';
import { LLMFunctionExtractionService } from './llmFunctionExtractionService';

export class LLMTestPlanningService {
    /**
     * Analyze functions from workspace using LLM extraction
     * This replaces regex-based extraction which incorrectly captured control flow keywords (for, if, switch, etc.)
     */
    static async analyzeFunctions(
        workspaceRoot: string,
        codeFiles: string[],
        llmService: any
    ): Promise<any[]> {
        SWLogger.log('[TestPlanning] Extracting functions using LLM (replaces regex extraction)...');
        
        const extractedFunctions = await LLMFunctionExtractionService.extractFunctionsFromWorkspace(
            workspaceRoot,
            codeFiles,
            llmService
        );
        
        // Convert to test plan format
        return LLMFunctionExtractionService.convertToTestPlanFormat(extractedFunctions);
    }
    
    /**
     * @deprecated Use analyzeFunctions with LLM extraction instead
     * Legacy method that used regex-based extraction (captured control flow keywords incorrectly)
     */
    static analyzeFunctionsLegacy(codeAnalysis: any): any[] {
        if (!codeAnalysis || !codeAnalysis.functions) {
            return [];
        }

        return codeAnalysis.functions.map((func: any) => ({
            name: func.name,
            file: func.file,
            startLine: func.startLine,
            endLine: func.endLine,
            lines: func.lines,
            complexity: func.complexity || 'unknown',
            parameters: func.parameters || [],
            returnType: func.returnType
        }));
    }

    /**
     * Create test plan using LLM (two-phase approach)
     * Phase 1: Get high-level strategy and test areas
     * Phase 2: Select specific functions for each area
     */
    static async createTestPlan(
        context: CodeAnalysis,
        functions: any[],
        llmService: any,
        productDocs?: any,
        architectureInsights?: any
    ): Promise<TestPlan> {
        SWLogger.log('[TestPlanning] Creating test plan with LLM (two-phase)...');
        SWLogger.log(`[TestPlanning] ${functions.length} functions available`);

        // Check if architecture insights already have test recommendations
        if (architectureInsights?.recommended_test_targets && 
            architectureInsights.recommended_test_targets.length > 0) {
            SWLogger.log('[TestPlanning] Using test recommendations from architecture analysis');
            SWLogger.log(`[TestPlanning] Found ${architectureInsights.recommended_test_targets.length} pre-analyzed test targets`);
            
            // Convert recommendations directly to test plan
            const functionGroups = this.convertRecommendationsToGroups(architectureInsights.recommended_test_targets);
            const totalSelected = functionGroups.reduce((sum, group) => sum + group.functions.length, 0);
            
            const testPlan: TestPlan = {
                strategy: 'Using recommendations from architecture analysis',
                total_functions: functions.length,
                testable_functions: totalSelected,
                function_groups: functionGroups
            };
            
            SWLogger.log(`[TestPlanning] Created plan with ${functionGroups.length} groups and ${totalSelected} total functions from architecture insights`);
            return testPlan;
        }

        // PHASE 1: Get high-level strategy (fallback if no architecture recommendations)
        SWLogger.log('[TestPlanning] Phase 1: Getting high-level test strategy...');
        const { buildPlanningPrompt, buildFunctionSelectionPrompt } = require('../../prompts/testPrompts');
        const strategyPrompt = buildPlanningPrompt(context, functions, productDocs, architectureInsights);
        const strategy = await llmService.generateTestStrategy(strategyPrompt);
        
        SWLogger.log(`[TestPlanning] Strategy: ${strategy.strategy}`);
        SWLogger.log(`[TestPlanning] Identified ${strategy.recommended_test_areas?.length || 0} test areas`);

        if (!strategy.recommended_test_areas || strategy.recommended_test_areas.length === 0) {
            throw new Error('LLM did not identify any test areas');
        }

        // PHASE 2: Select specific functions for each area
        SWLogger.log('[TestPlanning] Phase 2: Selecting functions for each area...');
        const functionGroups: any[] = [];
        let totalSelected = 0;

        for (const area of strategy.recommended_test_areas) {
            SWLogger.log(`[TestPlanning] Processing area: ${area.name}`);
            
            // Find functions that match this area's file patterns
            const matchingFunctions = functions.filter(func => {
                return area.file_patterns?.some((pattern: string) => {
                    // Simple pattern matching (support wildcards)
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(func.file);
                }) || false;
            });

            if (matchingFunctions.length === 0) {
                SWLogger.log(`[TestPlanning] No functions found for area ${area.name}, skipping`);
                continue;
            }

            SWLogger.log(`[TestPlanning] Found ${matchingFunctions.length} matching functions`);

            // Ask LLM to select up to 15 most important functions from this area
            const selectionPrompt = buildFunctionSelectionPrompt(area, matchingFunctions, 15);
            const selection = await llmService.generateTestStrategy(selectionPrompt);

            if (selection.selected_functions && selection.selected_functions.length > 0) {
                functionGroups.push({
                    group_id: area.area_id,
                    name: area.name,
                    priority: area.priority,
                    functions: selection.selected_functions
                });
                totalSelected += selection.selected_functions.length;
                SWLogger.log(`[TestPlanning] Selected ${selection.selected_functions.length} functions for ${area.name}`);
            }
        }

        const testPlan: TestPlan = {
            strategy: strategy.strategy,
            total_functions: functions.length,
            testable_functions: totalSelected,
            function_groups: functionGroups
        };

        SWLogger.log(`[TestPlanning] Created plan with ${functionGroups.length} groups and ${totalSelected} total functions`);

        return testPlan;
    }

    /**
     * Save test plan to disk
     */
    static async saveTestPlan(
        workspaceRoot: string,
        testPlan: TestPlan
    ): Promise<string> {
        const shadowDir = path.join(workspaceRoot, '.shadow');
        if (!fs.existsSync(shadowDir)) {
            fs.mkdirSync(shadowDir, { recursive: true });
        }

        const planPath = path.join(shadowDir, 'test-plan.json');
        fs.writeFileSync(planPath, JSON.stringify(testPlan, null, 2), 'utf-8');

        SWLogger.log(`[TestPlanning] Saved test plan to ${planPath}`);
        return planPath;
    }

    /**
     * Load saved test plan
     */
    static loadTestPlan(workspaceRoot: string): TestPlan | null {
        const planPath = path.join(workspaceRoot, '.shadow', 'test-plan.json');
        
        if (!fs.existsSync(planPath)) {
            return null;
        }

        try {
            const content = fs.readFileSync(planPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            SWLogger.log(`[TestPlanning] Error loading test plan: ${error}`);
            return null;
        }
    }

    /**
     * Convert architecture test recommendations to function groups
     */
    private static convertRecommendationsToGroups(recommendations: any[]): any[] {
        // Group by priority
        const critical = recommendations.filter(r => r.priority === 'critical');
        const high = recommendations.filter(r => r.priority === 'high');
        const medium = recommendations.filter(r => r.priority === 'medium');
        
        const groups: any[] = [];
        
        if (critical.length > 0) {
            groups.push({
                group_id: 'critical-functions',
                name: 'Critical Path Functions',
                priority: 1,
                functions: critical.map(r => ({
                    name: r.function_name,
                    file: r.file_path,
                    startLine: 0, // Will be filled in during generation
                    endLine: 0,
                    complexity: r.complexity,
                    dependencies: r.dependencies || [],
                    mocking_needed: r.dependencies && r.dependencies.length > 0
                }))
            });
        }
        
        if (high.length > 0) {
            groups.push({
                group_id: 'high-priority-functions',
                name: 'High Priority Functions',
                priority: 2,
                functions: high.map(r => ({
                    name: r.function_name,
                    file: r.file_path,
                    startLine: 0,
                    endLine: 0,
                    complexity: r.complexity,
                    dependencies: r.dependencies || [],
                    mocking_needed: r.dependencies && r.dependencies.length > 0
                }))
            });
        }
        
        if (medium.length > 0) {
            groups.push({
                group_id: 'medium-priority-functions',
                name: 'Medium Priority Functions',
                priority: 3,
                functions: medium.map(r => ({
                    name: r.function_name,
                    file: r.file_path,
                    startLine: 0,
                    endLine: 0,
                    complexity: r.complexity,
                    dependencies: r.dependencies || [],
                    mocking_needed: r.dependencies && r.dependencies.length > 0
                }))
            });
        }
        
        return groups;
    }

    /**
     * Get functions sorted by priority
     */
    static getPrioritizedFunctions(testPlan: TestPlan): TestableFunction[] {
        const allFunctions: TestableFunction[] = [];

        for (const group of testPlan.function_groups) {
            allFunctions.push(...group.functions);
        }

        // Sort by group priority
        const groupPriorityMap = new Map<string, number>();
        for (const group of testPlan.function_groups) {
            for (const func of group.functions) {
                groupPriorityMap.set(func.name, group.priority);
            }
        }

        allFunctions.sort((a, b) => {
            const priorityA = groupPriorityMap.get(a.name) || 999;
            const priorityB = groupPriorityMap.get(b.name) || 999;
            return priorityA - priorityB;
        });

        return allFunctions;
    }
}
