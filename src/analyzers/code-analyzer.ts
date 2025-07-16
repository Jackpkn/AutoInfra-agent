import {
  CodebaseInput,
  CodebaseIndex,
  AnalysisResult,
  TechStackInfo,
  DependencyInfo,
  ArchitectureInfo,
} from '../types';

/**
 * Interface for analyzing codebases
 */
export interface CodeAnalyzer {
  /**
   * Creates an index of the codebase for efficient analysis
   */
  indexCodebase(codebase: CodebaseInput): Promise<CodebaseIndex>;

  /**
   * Performs comprehensive analysis of the indexed codebase
   */
  analyzeCodebase(index: CodebaseIndex): Promise<AnalysisResult>;

  /**
   * Detects the technology stack used in the codebase
   */
  detectTechStack(index: CodebaseIndex): Promise<TechStackInfo>;

  /**
   * Analyzes dependencies and external services
   */
  analyzeDependencies(index: CodebaseIndex): Promise<DependencyInfo>;

  /**
   * Detects the architecture pattern of the application
   */
  detectArchitecture(index: CodebaseIndex): Promise<ArchitectureInfo>;
}

/**
 * Default implementation of CodeAnalyzer
 */
export class DefaultCodeAnalyzer implements CodeAnalyzer {
  async indexCodebase(codebase: CodebaseInput): Promise<CodebaseIndex> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async analyzeCodebase(index: CodebaseIndex): Promise<AnalysisResult> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async detectTechStack(index: CodebaseIndex): Promise<TechStackInfo> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async analyzeDependencies(index: CodebaseIndex): Promise<DependencyInfo> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async detectArchitecture(index: CodebaseIndex): Promise<ArchitectureInfo> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }
}
