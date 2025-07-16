import { ErrorResponse, ErrorCategory, FallbackOption } from '../types/common';

/**
 * Custom error class for infrastructure agent operations
 */
export class InfrastructureError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly recoverable: boolean;
  public readonly suggestions: string[];
  public readonly partialResults?: any;
  public readonly fallbackOptions: FallbackOption[];

  constructor(
    code: string,
    message: string,
    category: ErrorCategory,
    recoverable: boolean = false,
    suggestions: string[] = [],
    partialResults?: any,
    fallbackOptions: FallbackOption[] = []
  ) {
    super(message);
    this.name = 'InfrastructureError';
    this.code = code;
    this.category = category;
    this.recoverable = recoverable;
    this.suggestions = suggestions;
    this.partialResults = partialResults;
    this.fallbackOptions = fallbackOptions;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InfrastructureError);
    }
  }

  /**
   * Convert error to ErrorResponse format
   */
  toErrorResponse(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        category: this.category,
        recoverable: this.recoverable,
        suggestions: this.suggestions,
      },
      partialResults: this.partialResults,
      fallbackOptions: this.fallbackOptions,
    };
  }
}

/**
 * Error factory functions for different error categories
 */
export class ErrorFactory {
  /**
   * Create an analysis error
   */
  static createAnalysisError(
    code: string,
    message: string,
    recoverable: boolean = false,
    suggestions: string[] = [],
    partialResults?: any,
    fallbackOptions: FallbackOption[] = []
  ): InfrastructureError {
    return new InfrastructureError(
      code,
      message,
      'analysis',
      recoverable,
      suggestions,
      partialResults,
      fallbackOptions
    );
  }

  /**
   * Create a generation error
   */
  static createGenerationError(
    code: string,
    message: string,
    recoverable: boolean = false,
    suggestions: string[] = [],
    partialResults?: any,
    fallbackOptions: FallbackOption[] = []
  ): InfrastructureError {
    return new InfrastructureError(
      code,
      message,
      'generation',
      recoverable,
      suggestions,
      partialResults,
      fallbackOptions
    );
  }

  /**
   * Create a validation error
   */
  static createValidationError(
    code: string,
    message: string,
    recoverable: boolean = true,
    suggestions: string[] = [],
    partialResults?: any,
    fallbackOptions: FallbackOption[] = []
  ): InfrastructureError {
    return new InfrastructureError(
      code,
      message,
      'validation',
      recoverable,
      suggestions,
      partialResults,
      fallbackOptions
    );
  }

  /**
   * Create an integration error
   */
  static createIntegrationError(
    code: string,
    message: string,
    recoverable: boolean = true,
    suggestions: string[] = [],
    partialResults?: any,
    fallbackOptions: FallbackOption[] = []
  ): InfrastructureError {
    return new InfrastructureError(
      code,
      message,
      'integration',
      recoverable,
      suggestions,
      partialResults,
      fallbackOptions
    );
  }

  /**
   * Create a recommendation error
   */
  static createRecommendationError(
    code: string,
    message: string,
    recoverable: boolean = true,
    suggestions: string[] = [],
    partialResults?: any,
    fallbackOptions: FallbackOption[] = []
  ): InfrastructureError {
    return new InfrastructureError(
      code,
      message,
      'recommendation',
      recoverable,
      suggestions,
      partialResults,
      fallbackOptions
    );
  }

  /**
   * Create error from unknown error object
   */
  static fromUnknownError(
    error: unknown,
    category: ErrorCategory = 'analysis',
    defaultCode: string = 'UNKNOWN_ERROR'
  ): InfrastructureError {
    if (error instanceof InfrastructureError) {
      return error;
    }

    if (error instanceof Error) {
      return new InfrastructureError(
        defaultCode,
        error.message,
        category,
        false,
        ['Check the error details and try again'],
        undefined,
        []
      );
    }

    return new InfrastructureError(
      defaultCode,
      'An unknown error occurred',
      category,
      false,
      ['Check the system logs for more details'],
      undefined,
      []
    );
  }
}

/**
 * Common error codes and messages
 */
export const ErrorCodes = {
  // Analysis errors
  CODEBASE_PARSING_FAILED: 'CODEBASE_PARSING_FAILED',
  TECH_STACK_DETECTION_FAILED: 'TECH_STACK_DETECTION_FAILED',
  DEPENDENCY_ANALYSIS_FAILED: 'DEPENDENCY_ANALYSIS_FAILED',
  ARCHITECTURE_DETECTION_FAILED: 'ARCHITECTURE_DETECTION_FAILED',
  FILE_INDEXING_FAILED: 'FILE_INDEXING_FAILED',
  AST_PARSING_FAILED: 'AST_PARSING_FAILED',

  // Generation errors
  DOCKER_GENERATION_FAILED: 'DOCKER_GENERATION_FAILED',
  KUBERNETES_GENERATION_FAILED: 'KUBERNETES_GENERATION_FAILED',
  CICD_GENERATION_FAILED: 'CICD_GENERATION_FAILED',
  CONFIG_GENERATION_FAILED: 'CONFIG_GENERATION_FAILED',
  TEMPLATE_RENDERING_FAILED: 'TEMPLATE_RENDERING_FAILED',

  // Validation errors
  INVALID_CODEBASE_INPUT: 'INVALID_CODEBASE_INPUT',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  SCHEMA_VALIDATION_FAILED: 'SCHEMA_VALIDATION_FAILED',

  // Integration errors
  REPOSITORY_ACCESS_FAILED: 'REPOSITORY_ACCESS_FAILED',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',

  // Recommendation errors
  COST_CALCULATION_FAILED: 'COST_CALCULATION_FAILED',
  RESOURCE_ESTIMATION_FAILED: 'RESOURCE_ESTIMATION_FAILED',
  RECOMMENDATION_GENERATION_FAILED: 'RECOMMENDATION_GENERATION_FAILED',
  OPTIMIZATION_FAILED: 'OPTIMIZATION_FAILED',
} as const;

/**
 * Common error messages
 */
export const ErrorMessages = {
  [ErrorCodes.CODEBASE_PARSING_FAILED]: 'Failed to parse the uploaded codebase',
  [ErrorCodes.TECH_STACK_DETECTION_FAILED]: 'Unable to detect the technology stack',
  [ErrorCodes.DEPENDENCY_ANALYSIS_FAILED]: 'Failed to analyze project dependencies',
  [ErrorCodes.ARCHITECTURE_DETECTION_FAILED]: 'Could not determine the application architecture',
  [ErrorCodes.FILE_INDEXING_FAILED]: 'Failed to index project files',
  [ErrorCodes.AST_PARSING_FAILED]: 'Abstract syntax tree parsing failed',

  [ErrorCodes.DOCKER_GENERATION_FAILED]: 'Failed to generate Docker configuration',
  [ErrorCodes.KUBERNETES_GENERATION_FAILED]: 'Failed to generate Kubernetes manifests',
  [ErrorCodes.CICD_GENERATION_FAILED]: 'Failed to generate CI/CD pipeline configuration',
  [ErrorCodes.CONFIG_GENERATION_FAILED]: 'Configuration generation failed',
  [ErrorCodes.TEMPLATE_RENDERING_FAILED]: 'Template rendering failed',

  [ErrorCodes.INVALID_CODEBASE_INPUT]: 'Invalid codebase input provided',
  [ErrorCodes.INVALID_CONFIGURATION]: 'Invalid configuration detected',
  [ErrorCodes.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCodes.SCHEMA_VALIDATION_FAILED]: 'Schema validation failed',

  [ErrorCodes.REPOSITORY_ACCESS_FAILED]: 'Failed to access the repository',
  [ErrorCodes.FILE_UPLOAD_FAILED]: 'File upload failed',
  [ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE]: 'External service is unavailable',
  [ErrorCodes.API_REQUEST_FAILED]: 'API request failed',
  [ErrorCodes.AUTHENTICATION_FAILED]: 'Authentication failed',

  [ErrorCodes.COST_CALCULATION_FAILED]: 'Cost calculation failed',
  [ErrorCodes.RESOURCE_ESTIMATION_FAILED]: 'Resource estimation failed',
  [ErrorCodes.RECOMMENDATION_GENERATION_FAILED]: 'Failed to generate recommendations',
  [ErrorCodes.OPTIMIZATION_FAILED]: 'Optimization process failed',
} as const;

/**
 * Common fallback options
 */
export const FallbackOptions = {
  RETRY_WITH_DEFAULTS: {
    type: 'retry',
    description: 'Retry with default configuration',
    action: 'retry_with_defaults',
  },
  MANUAL_CONFIGURATION: {
    type: 'manual',
    description: 'Proceed with manual configuration',
    action: 'manual_config',
  },
  SKIP_STEP: {
    type: 'skip',
    description: 'Skip this step and continue',
    action: 'skip_step',
  },
  USE_BASIC_TEMPLATE: {
    type: 'template',
    description: 'Use basic template instead',
    action: 'use_basic_template',
  },
  CONTACT_SUPPORT: {
    type: 'support',
    description: 'Contact support for assistance',
    action: 'contact_support',
  },
} as const;

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Handle and format error for API response
   */
  static handleError(error: unknown, context?: string): ErrorResponse {
    const infraError = ErrorFactory.fromUnknownError(error);

    if (context) {
      infraError.message = `${context}: ${infraError.message}`;
    }

    return infraError.toErrorResponse();
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: unknown): boolean {
    if (error instanceof InfrastructureError) {
      return error.recoverable;
    }
    return false;
  }

  /**
   * Get error suggestions
   */
  static getSuggestions(error: unknown): string[] {
    if (error instanceof InfrastructureError) {
      return error.suggestions;
    }
    return ['Check the error details and try again'];
  }

  /**
   * Get fallback options
   */
  static getFallbackOptions(error: unknown): FallbackOption[] {
    if (error instanceof InfrastructureError) {
      return error.fallbackOptions;
    }
    return [FallbackOptions.RETRY_WITH_DEFAULTS, FallbackOptions.CONTACT_SUPPORT];
  }

  /**
   * Log error with appropriate level
   */
  static logError(
    error: unknown,
    logger?: { error: (message: string, error?: Error) => void }
  ): void {
    if (logger) {
      if (error instanceof InfrastructureError) {
        logger.error(`[${error.category.toUpperCase()}] ${error.code}: ${error.message}`, error);
      } else if (error instanceof Error) {
        logger.error(`Unexpected error: ${error.message}`, error);
      } else {
        logger.error(`Unknown error: ${String(error)}`);
      }
    } else {
      console.error('Error:', error);
    }
  }
}
