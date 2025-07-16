import { CodebaseIndex, TechStackInfo } from "../types";

/**
 * Interface for detecting technology stack from codebase
 */
export interface TechStackDetector {
  /**
   * Detects the primary programming language
   */
  detectLanguage(index: CodebaseIndex): Promise<string>;

  /**
   * Detects the framework being used
   */
  detectFramework(index: CodebaseIndex): Promise<string>;

  /**
   * Detects runtime version requirements
   */
  detectRuntime(
    index: CodebaseIndex
  ): Promise<{ name: string; version: string }>;

  /**
   * Detects build tools and package managers
   */
  detectBuildTools(
    index: CodebaseIndex
  ): Promise<{ buildTool: string; packageManager: string }>;

  /**
   * Performs complete tech stack detection
   */
  detect(index: CodebaseIndex): Promise<TechStackInfo>;
}

/**
 * Default implementation of TechStackDetector
 */
export class DefaultTechStackDetector implements TechStackDetector {
  async detectLanguage(index: CodebaseIndex): Promise<string> {
    // Implementation will be added in later tasks
    throw new Error("Not implemented yet");
  }

  async detectFramework(index: CodebaseIndex): Promise<string> {
    // Implementation will be added in later tasks
    throw new Error("Not implemented yet");
  }

  async detectRuntime(
    index: CodebaseIndex
  ): Promise<{ name: string; version: string }> {
    // Implementation will be added in later tasks
    throw new Error("Not implemented yet");
  }

  async detectBuildTools(
    index: CodebaseIndex
  ): Promise<{ buildTool: string; packageManager: string }> {
    // Implementation will be added in later tasks
    throw new Error("Not implemented yet");
  }

  async detect(index: CodebaseIndex): Promise<TechStackInfo> {
    // Implementation will be added in later tasks
    throw new Error("Not implemented yet");
  }
}
