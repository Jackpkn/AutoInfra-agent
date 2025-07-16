import { AnalysisResult, DockerConfiguration } from '../types';

/**
 * Interface for generating Docker configurations
 */
export interface DockerGenerator {
  /**
   * Generates a complete Docker configuration
   */
  generateDockerConfig(analysis: AnalysisResult): Promise<DockerConfiguration>;

  /**
   * Generates a Dockerfile
   */
  generateDockerfile(analysis: AnalysisResult): Promise<string>;

  /**
   * Generates a .dockerignore file
   */
  generateDockerignore(analysis: AnalysisResult): Promise<string>;

  /**
   * Generates a docker-compose.yml file for multi-service applications
   */
  generateDockerCompose(analysis: AnalysisResult): Promise<string | undefined>;
}

/**
 * Default implementation of DockerGenerator
 */
export class DefaultDockerGenerator implements DockerGenerator {
  async generateDockerConfig(analysis: AnalysisResult): Promise<DockerConfiguration> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async generateDockerfile(analysis: AnalysisResult): Promise<string> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async generateDockerignore(analysis: AnalysisResult): Promise<string> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async generateDockerCompose(analysis: AnalysisResult): Promise<string | undefined> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }
}
