/**
 * AutoInfra Agent - Zero-touch infrastructure setup system
 * 
 * Main entry point for the application
 */

export * from './types';
export * from './analyzers';
export * from './generators';
export * from './recommenders';
export * from './utils';
export * from './api';

// Main application class
export class AutoInfraAgent {
  private initialized = false;

  /**
   * Initialize the AutoInfra Agent
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialization logic will be implemented in later tasks
    this.initialized = true;
  }

  /**
   * Check if the agent is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Default export
export default AutoInfraAgent;