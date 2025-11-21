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

export class LLMTestPlanningService {
    /**
     * Analyze functions from code analysis
     */
    static analyzeFunctions(codeAnalysis: any): any[] {
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
     * Create test plan using LLM
     */
    static async createTestPlan(
        context: CodeAnalysis,
        functions: any[],
        llmService: any,
        productDocs?: any,
        architectureInsights?: any
    ): Promise<TestPlan> {
        SWLogger.log('[TestPlanning] Creating test plan with LLM...');
        SWLogger.log(`[TestPlanning] Analyzing ${functions.length} functions`);

        // Build prompt
        const prompt = buildPlanningPrompt(context, functions, productDocs, architectureInsights);

        // Call LLM to generate test strategy
        const testPlan = await llmService.generateTestStrategy(prompt);

        SWLogger.log(`[TestPlanning] Created plan with ${testPlan.function_groups.length} function groups`);
        SWLogger.log(`[TestPlanning] ${testPlan.testable_functions} of ${testPlan.total_functions} functions are testable`);

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
