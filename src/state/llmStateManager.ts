/**
 * State Manager for LLM Integration
 * Centralizes all state management for LLM-powered features
 */
import * as vscode from 'vscode';
import { LLMService, AnalysisContext, LLMInsights } from '../llmService';
import { EnhancedProductDocumentation } from '../fileDocumentation';
import { CodeAnalysis } from '../analyzer';
import { InsightsTreeProvider } from '../insightsTreeView';
import { ProductNavigatorProvider } from '../productNavigator';
import { InsightsViewerProvider } from '../insightsViewer';
import { AnalysisViewerProvider } from '../analysisViewer';
import { UnitTestsNavigatorProvider } from '../unitTestsNavigator';
import { ReportsViewer } from '../ui/reportsViewer';
import { ReportsTreeProvider } from '../reportsTreeProvider';

export class LLMStateManager {
    private llmService: LLMService | null = null;
    private lastAnalysisContext: AnalysisContext | null = null;
    private lastEnhancedProductDocs: EnhancedProductDocumentation | null = null;
    private lastLLMInsights: LLMInsights | null = null;
    private lastCodeAnalysis: CodeAnalysis | null = null;
    
    private treeProvider: InsightsTreeProvider | null = null;
    private productNavigator: ProductNavigatorProvider | null = null;
    private insightsViewer: InsightsViewerProvider | null = null;
    private analysisViewer: AnalysisViewerProvider | null = null;
    private unitTestsNavigator: UnitTestsNavigatorProvider | null = null;
    private reportsViewer: ReportsViewer | null = null;
    private reportsTreeProvider: ReportsTreeProvider | null = null;
    private outputChannel: vscode.OutputChannel | null = null;

    // LLM Service
    getLLMService(): LLMService {
        if (!this.llmService) {
            throw new Error('LLM Service not initialized');
        }
        return this.llmService;
    }

    setLLMService(service: LLMService): void {
        this.llmService = service;
    }

    // Analysis Context
    getAnalysisContext(): AnalysisContext | null {
        return this.lastAnalysisContext;
    }

    setAnalysisContext(context: AnalysisContext): void {
        this.lastAnalysisContext = context;
    }

    // Enhanced Product Docs
    getEnhancedProductDocs(): EnhancedProductDocumentation | null {
        return this.lastEnhancedProductDocs;
    }

    setEnhancedProductDocs(docs: EnhancedProductDocumentation): void {
        this.lastEnhancedProductDocs = docs;
        // Update UI if available
        if (this.productNavigator) {
            this.productNavigator.setProductDocs(docs);
        }
        if (this.treeProvider) {
            this.treeProvider.setProductDocsStatus('complete');
        }
    }

    // LLM Insights
    getLLMInsights(): LLMInsights | null {
        return this.lastLLMInsights;
    }

    setLLMInsights(insights: LLMInsights): void {
        this.lastLLMInsights = insights;
        // Update UI if available
        if (this.insightsViewer) {
            this.insightsViewer.setInsights(insights);
        }
    }

    // Code Analysis
    getCodeAnalysis(): CodeAnalysis | null {
        return this.lastCodeAnalysis;
    }

    setCodeAnalysis(analysis: CodeAnalysis): void {
        this.lastCodeAnalysis = analysis;
        // Update UI if available
        if (this.analysisViewer) {
            this.analysisViewer.setAnalysis(analysis);
        }
    }

    // Tree Provider
    getTreeProvider(): InsightsTreeProvider | null {
        return this.treeProvider;
    }

    setTreeProvider(provider: InsightsTreeProvider): void {
        this.treeProvider = provider;
        if (this.llmService) {
            provider.setLLMService(this.llmService);
        }
        // Update status if we already have data
        if (this.lastEnhancedProductDocs) {
            provider.setProductDocsStatus('complete');
        }
        if (this.lastAnalysisContext) {
            provider.setAnalysisComplete();
        }
    }

    // Product Navigator
    getProductNavigator(): ProductNavigatorProvider | null {
        return this.productNavigator;
    }

    setProductNavigator(provider: ProductNavigatorProvider): void {
        this.productNavigator = provider;
        // Set docs if we already have them
        if (this.lastEnhancedProductDocs) {
            provider.setProductDocs(this.lastEnhancedProductDocs);
        }
    }

    // Insights Viewer
    getInsightsViewer(): InsightsViewerProvider | null {
        return this.insightsViewer;
    }

    setInsightsViewer(provider: InsightsViewerProvider): void {
        this.insightsViewer = provider;
        // Set insights if we already have them
        if (this.lastLLMInsights) {
            provider.setInsights(this.lastLLMInsights);
        }
    }

    // Analysis Viewer
    getAnalysisViewer(): AnalysisViewerProvider | null {
        return this.analysisViewer;
    }

    setAnalysisViewer(provider: AnalysisViewerProvider): void {
        this.analysisViewer = provider;
        // Set analysis if we already have it
        if (this.lastCodeAnalysis) {
            provider.setAnalysis(this.lastCodeAnalysis);
        }
    }

    // Unit Tests Navigator
    getUnitTestsNavigator(): UnitTestsNavigatorProvider | null {
        return this.unitTestsNavigator;
    }

    setUnitTestsNavigator(provider: UnitTestsNavigatorProvider): void {
        this.unitTestsNavigator = provider;
    }

    // Reports Viewer
    getReportsViewer(): ReportsViewer | null {
        return this.reportsViewer;
    }

    setReportsViewer(viewer: ReportsViewer): void {
        this.reportsViewer = viewer;
    }

    // Reports Tree Provider
    getReportsTreeProvider(): ReportsTreeProvider | null {
        return this.reportsTreeProvider;
    }

    setReportsTreeProvider(provider: ReportsTreeProvider): void {
        this.reportsTreeProvider = provider;
    }

    // Output Channel
    getOutputChannel(): vscode.OutputChannel {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('Shadow Watch Documentation');
        }
        return this.outputChannel;
    }

    // Clear all state
    clearAll(): void {
        this.lastAnalysisContext = null;
        this.lastEnhancedProductDocs = null;
        this.lastLLMInsights = null;
        this.lastCodeAnalysis = null;
    }
}

// Singleton instance
let stateManagerInstance: LLMStateManager | null = null;

export function getStateManager(): LLMStateManager {
    if (!stateManagerInstance) {
        stateManagerInstance = new LLMStateManager();
    }
    return stateManagerInstance;
}

