import { CodebaseIndex, DependencyInfo, DependencyGraph } from '../types';

/**
 * Interface for analyzing dependencies in codebases
 */
export interface DependencyAnalyzer {
  /**
   * Analyzes all dependencies in the codebase
   */
  analyzeDependencies(index: CodebaseIndex): Promise<DependencyInfo>;

  /**
   * Detects database dependencies
   */
  detectDatabases(index: CodebaseIndex): Promise<DependencyInfo['databases']>;

  /**
   * Detects cache dependencies
   */
  detectCaches(index: CodebaseIndex): Promise<DependencyInfo['caches']>;

  /**
   * Detects message queue dependencies
   */
  detectMessageQueues(index: CodebaseIndex): Promise<DependencyInfo['messageQueues']>;

  /**
   * Detects external service dependencies
   */
  detectExternalServices(index: CodebaseIndex): Promise<DependencyInfo['externalServices']>;

  /**
   * Builds a dependency graph of the codebase
   */
  buildDependencyGraph(index: CodebaseIndex): Promise<DependencyGraph>;
}

/**
 * Default implementation of DependencyAnalyzer
 */
export class DefaultDependencyAnalyzer implements DependencyAnalyzer {
  async analyzeDependencies(index: CodebaseIndex): Promise<DependencyInfo> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async detectDatabases(index: CodebaseIndex): Promise<DependencyInfo['databases']> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async detectCaches(index: CodebaseIndex): Promise<DependencyInfo['caches']> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async detectMessageQueues(index: CodebaseIndex): Promise<DependencyInfo['messageQueues']> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async detectExternalServices(index: CodebaseIndex): Promise<DependencyInfo['externalServices']> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async buildDependencyGraph(index: CodebaseIndex): Promise<DependencyGraph> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }
}
