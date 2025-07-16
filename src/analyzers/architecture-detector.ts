import { CodebaseIndex, ArchitectureInfo, ServiceInfo, CommunicationPattern } from '../types';

/**
 * Interface for detecting application architecture patterns
 */
export interface ArchitectureDetector {
  /**
   * Detects the overall architecture type
   */
  detectArchitectureType(index: CodebaseIndex): Promise<ArchitectureInfo['type']>;

  /**
   * Identifies services in the application
   */
  identifyServices(index: CodebaseIndex): Promise<ServiceInfo[]>;

  /**
   * Analyzes communication patterns between services
   */
  analyzeCommunicationPatterns(index: CodebaseIndex): Promise<CommunicationPattern[]>;

  /**
   * Performs complete architecture detection
   */
  detectArchitecture(index: CodebaseIndex): Promise<ArchitectureInfo>;
}

/**
 * Default implementation of ArchitectureDetector
 */
export class DefaultArchitectureDetector implements ArchitectureDetector {
  async detectArchitectureType(index: CodebaseIndex): Promise<ArchitectureInfo['type']> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async identifyServices(index: CodebaseIndex): Promise<ServiceInfo[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async analyzeCommunicationPatterns(index: CodebaseIndex): Promise<CommunicationPattern[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async detectArchitecture(index: CodebaseIndex): Promise<ArchitectureInfo> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }
}
