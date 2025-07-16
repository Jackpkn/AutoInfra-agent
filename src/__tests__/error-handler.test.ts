import { describe, it, expect, vi } from 'vitest';
import {
  InfrastructureError,
  ErrorFactory,
  ErrorCodes,
  ErrorMessages,
  FallbackOptions,
  ErrorHandler,
} from '../utils/error-handler';
import { ErrorCategory } from '../types/common';

describe('Error Handler', () => {
  describe('InfrastructureError', () => {
    it('should create an infrastructure error with all properties', () => {
      const error = new InfrastructureError(
        'TEST_ERROR',
        'Test error message',
        'analysis',
        true,
        ['Try again', 'Check logs'],
        { partial: 'data' },
        [FallbackOptions.RETRY_WITH_DEFAULTS]
      );

      expect(error.name).toBe('InfrastructureError');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.category).toBe('analysis');
      expect(error.recoverable).toBe(true);
      expect(error.suggestions).toEqual(['Try again', 'Check logs']);
      expect(error.partialResults).toEqual({ partial: 'data' });
      expect(error.fallbackOptions).toEqual([FallbackOptions.RETRY_WITH_DEFAULTS]);
    });

    it('should create an infrastructure error with minimal properties', () => {
      const error = new InfrastructureError('SIMPLE_ERROR', 'Simple message', 'validation');

      expect(error.code).toBe('SIMPLE_ERROR');
      expect(error.message).toBe('Simple message');
      expect(error.category).toBe('validation');
      expect(error.recoverable).toBe(false);
      expect(error.suggestions).toEqual([]);
      expect(error.partialResults).toBeUndefined();
      expect(error.fallbackOptions).toEqual([]);
    });

    it('should convert to ErrorResponse format', () => {
      const error = new InfrastructureError(
        'TEST_ERROR',
        'Test message',
        'generation',
        true,
        ['Suggestion 1'],
        { data: 'partial' },
        [FallbackOptions.MANUAL_CONFIGURATION]
      );

      const response = error.toErrorResponse();

      expect(response).toEqual({
        error: {
          code: 'TEST_ERROR',
          message: 'Test message',
          category: 'generation',
          recoverable: true,
          suggestions: ['Suggestion 1'],
        },
        partialResults: { data: 'partial' },
        fallbackOptions: [FallbackOptions.MANUAL_CONFIGURATION],
      });
    });
  });

  describe('ErrorFactory', () => {
    it('should create analysis error', () => {
      const error = ErrorFactory.createAnalysisError(
        'ANALYSIS_FAILED',
        'Analysis failed',
        true,
        ['Check input'],
        { analyzed: 50 },
        [FallbackOptions.USE_BASIC_TEMPLATE]
      );

      expect(error).toBeInstanceOf(InfrastructureError);
      expect(error.code).toBe('ANALYSIS_FAILED');
      expect(error.category).toBe('analysis');
      expect(error.recoverable).toBe(true);
      expect(error.suggestions).toEqual(['Check input']);
      expect(error.partialResults).toEqual({ analyzed: 50 });
      expect(error.fallbackOptions).toEqual([FallbackOptions.USE_BASIC_TEMPLATE]);
    });

    it('should create generation error', () => {
      const error = ErrorFactory.createGenerationError('GEN_FAILED', 'Generation failed');

      expect(error.category).toBe('generation');
      expect(error.code).toBe('GEN_FAILED');
      expect(error.recoverable).toBe(false);
    });

    it('should create validation error', () => {
      const error = ErrorFactory.createValidationError('VALIDATION_FAILED', 'Validation failed');

      expect(error.category).toBe('validation');
      expect(error.recoverable).toBe(true); // Default for validation errors
    });

    it('should create integration error', () => {
      const error = ErrorFactory.createIntegrationError('INTEGRATION_FAILED', 'Integration failed');

      expect(error.category).toBe('integration');
      expect(error.recoverable).toBe(true); // Default for integration errors
    });

    it('should create recommendation error', () => {
      const error = ErrorFactory.createRecommendationError('REC_FAILED', 'Recommendation failed');

      expect(error.category).toBe('recommendation');
      expect(error.recoverable).toBe(true); // Default for recommendation errors
    });

    it('should create error from InfrastructureError', () => {
      const originalError = new InfrastructureError('ORIGINAL', 'Original message', 'analysis');
      const error = ErrorFactory.fromUnknownError(originalError);

      expect(error).toBe(originalError); // Should return the same instance
    });

    it('should create error from standard Error', () => {
      const originalError = new Error('Standard error message');
      const error = ErrorFactory.fromUnknownError(originalError, 'generation', 'CUSTOM_CODE');

      expect(error).toBeInstanceOf(InfrastructureError);
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.message).toBe('Standard error message');
      expect(error.category).toBe('generation');
      expect(error.recoverable).toBe(false);
      expect(error.suggestions).toEqual(['Check the error details and try again']);
    });

    it('should create error from unknown object', () => {
      const error = ErrorFactory.fromUnknownError('string error', 'validation');

      expect(error).toBeInstanceOf(InfrastructureError);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toBe('An unknown error occurred');
      expect(error.category).toBe('validation');
      expect(error.suggestions).toEqual(['Check the system logs for more details']);
    });

    it('should use default category and code when not provided', () => {
      const error = ErrorFactory.fromUnknownError(new Error('Test'));

      expect(error.category).toBe('analysis'); // Default category
      expect(error.code).toBe('UNKNOWN_ERROR'); // Default code
    });
  });

  describe('ErrorCodes and ErrorMessages', () => {
    it('should have corresponding messages for all error codes', () => {
      const codes = Object.values(ErrorCodes);
      const messages = Object.keys(ErrorMessages);

      codes.forEach(code => {
        expect(messages).toContain(code);
        expect(ErrorMessages[code as keyof typeof ErrorMessages]).toBeTruthy();
      });
    });

    it('should have analysis error codes', () => {
      expect(ErrorCodes.CODEBASE_PARSING_FAILED).toBe('CODEBASE_PARSING_FAILED');
      expect(ErrorCodes.TECH_STACK_DETECTION_FAILED).toBe('TECH_STACK_DETECTION_FAILED');
      expect(ErrorCodes.DEPENDENCY_ANALYSIS_FAILED).toBe('DEPENDENCY_ANALYSIS_FAILED');
    });

    it('should have generation error codes', () => {
      expect(ErrorCodes.DOCKER_GENERATION_FAILED).toBe('DOCKER_GENERATION_FAILED');
      expect(ErrorCodes.KUBERNETES_GENERATION_FAILED).toBe('KUBERNETES_GENERATION_FAILED');
      expect(ErrorCodes.CICD_GENERATION_FAILED).toBe('CICD_GENERATION_FAILED');
    });

    it('should have validation error codes', () => {
      expect(ErrorCodes.INVALID_CODEBASE_INPUT).toBe('INVALID_CODEBASE_INPUT');
      expect(ErrorCodes.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
    });

    it('should have integration error codes', () => {
      expect(ErrorCodes.REPOSITORY_ACCESS_FAILED).toBe('REPOSITORY_ACCESS_FAILED');
      expect(ErrorCodes.API_REQUEST_FAILED).toBe('API_REQUEST_FAILED');
    });

    it('should have recommendation error codes', () => {
      expect(ErrorCodes.COST_CALCULATION_FAILED).toBe('COST_CALCULATION_FAILED');
      expect(ErrorCodes.RECOMMENDATION_GENERATION_FAILED).toBe('RECOMMENDATION_GENERATION_FAILED');
    });
  });

  describe('FallbackOptions', () => {
    it('should have predefined fallback options', () => {
      expect(FallbackOptions.RETRY_WITH_DEFAULTS).toEqual({
        type: 'retry',
        description: 'Retry with default configuration',
        action: 'retry_with_defaults',
      });

      expect(FallbackOptions.MANUAL_CONFIGURATION).toEqual({
        type: 'manual',
        description: 'Proceed with manual configuration',
        action: 'manual_config',
      });

      expect(FallbackOptions.SKIP_STEP).toEqual({
        type: 'skip',
        description: 'Skip this step and continue',
        action: 'skip_step',
      });

      expect(FallbackOptions.USE_BASIC_TEMPLATE).toEqual({
        type: 'template',
        description: 'Use basic template instead',
        action: 'use_basic_template',
      });

      expect(FallbackOptions.CONTACT_SUPPORT).toEqual({
        type: 'support',
        description: 'Contact support for assistance',
        action: 'contact_support',
      });
    });
  });

  describe('ErrorHandler', () => {
    it('should handle InfrastructureError', () => {
      const error = new InfrastructureError('TEST_ERROR', 'Test message', 'analysis');
      const response = ErrorHandler.handleError(error);

      expect(response.error.code).toBe('TEST_ERROR');
      expect(response.error.message).toBe('Test message');
      expect(response.error.category).toBe('analysis');
    });

    it('should handle standard Error', () => {
      const error = new Error('Standard error');
      const response = ErrorHandler.handleError(error);

      expect(response.error.code).toBe('UNKNOWN_ERROR');
      expect(response.error.message).toBe('Standard error');
      expect(response.error.category).toBe('analysis');
    });

    it('should handle unknown error', () => {
      const response = ErrorHandler.handleError('string error');

      expect(response.error.code).toBe('UNKNOWN_ERROR');
      expect(response.error.message).toBe('An unknown error occurred');
    });

    it('should add context to error message', () => {
      const error = new Error('Original message');
      const response = ErrorHandler.handleError(error, 'During analysis');

      expect(response.error.message).toBe('During analysis: Original message');
    });

    it('should check if error is recoverable', () => {
      const recoverableError = new InfrastructureError('TEST', 'Test', 'validation', true);
      const nonRecoverableError = new InfrastructureError('TEST', 'Test', 'analysis', false);
      const standardError = new Error('Standard');

      expect(ErrorHandler.isRecoverable(recoverableError)).toBe(true);
      expect(ErrorHandler.isRecoverable(nonRecoverableError)).toBe(false);
      expect(ErrorHandler.isRecoverable(standardError)).toBe(false);
    });

    it('should get error suggestions', () => {
      const errorWithSuggestions = new InfrastructureError('TEST', 'Test', 'analysis', false, [
        'Suggestion 1',
        'Suggestion 2',
      ]);
      const errorWithoutSuggestions = new Error('Standard');

      expect(ErrorHandler.getSuggestions(errorWithSuggestions)).toEqual([
        'Suggestion 1',
        'Suggestion 2',
      ]);
      expect(ErrorHandler.getSuggestions(errorWithoutSuggestions)).toEqual([
        'Check the error details and try again',
      ]);
    });

    it('should get fallback options', () => {
      const errorWithFallbacks = new InfrastructureError(
        'TEST',
        'Test',
        'analysis',
        false,
        [],
        undefined,
        [FallbackOptions.RETRY_WITH_DEFAULTS]
      );
      const errorWithoutFallbacks = new Error('Standard');

      expect(ErrorHandler.getFallbackOptions(errorWithFallbacks)).toEqual([
        FallbackOptions.RETRY_WITH_DEFAULTS,
      ]);
      expect(ErrorHandler.getFallbackOptions(errorWithoutFallbacks)).toEqual([
        FallbackOptions.RETRY_WITH_DEFAULTS,
        FallbackOptions.CONTACT_SUPPORT,
      ]);
    });

    it('should log error with logger', () => {
      const mockLogger = {
        error: vi.fn(),
      };

      const infraError = new InfrastructureError('TEST_ERROR', 'Test message', 'analysis');
      const standardError = new Error('Standard error');
      const unknownError = 'string error';

      ErrorHandler.logError(infraError, mockLogger);
      ErrorHandler.logError(standardError, mockLogger);
      ErrorHandler.logError(unknownError, mockLogger);

      expect(mockLogger.error).toHaveBeenCalledTimes(3);
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ANALYSIS] TEST_ERROR: Test message',
        infraError
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected error: Standard error',
        standardError
      );
      expect(mockLogger.error).toHaveBeenCalledWith('Unknown error: string error');
    });

    it('should log error without logger', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = new Error('Test error');
      ErrorHandler.logError(error);

      expect(consoleSpy).toHaveBeenCalledWith('Error:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('Error Categories', () => {
    it('should create errors for all categories', () => {
      const categories: ErrorCategory[] = [
        'analysis',
        'generation',
        'validation',
        'integration',
        'recommendation',
      ];

      categories.forEach(category => {
        const error = new InfrastructureError('TEST', 'Test message', category);
        expect(error.category).toBe(category);
      });
    });
  });

  describe('Real-world error scenarios', () => {
    it('should handle codebase parsing failure with partial results', () => {
      const error = ErrorFactory.createAnalysisError(
        ErrorCodes.CODEBASE_PARSING_FAILED,
        ErrorMessages[ErrorCodes.CODEBASE_PARSING_FAILED],
        true,
        ['Check file encoding', 'Verify file structure'],
        { parsedFiles: 15, totalFiles: 20 },
        [FallbackOptions.USE_BASIC_TEMPLATE, FallbackOptions.MANUAL_CONFIGURATION]
      );

      expect(error.code).toBe('CODEBASE_PARSING_FAILED');
      expect(error.recoverable).toBe(true);
      expect(error.partialResults).toEqual({ parsedFiles: 15, totalFiles: 20 });
      expect(error.fallbackOptions).toHaveLength(2);
    });

    it('should handle Docker generation failure', () => {
      const error = ErrorFactory.createGenerationError(
        ErrorCodes.DOCKER_GENERATION_FAILED,
        ErrorMessages[ErrorCodes.DOCKER_GENERATION_FAILED],
        true,
        ['Check base image availability', 'Verify build context'],
        undefined,
        [FallbackOptions.USE_BASIC_TEMPLATE]
      );

      expect(error.category).toBe('generation');
      expect(error.recoverable).toBe(true);
      expect(error.suggestions).toContain('Check base image availability');
    });

    it('should handle validation error with field-specific information', () => {
      const error = ErrorFactory.createValidationError(
        ErrorCodes.INVALID_CONFIGURATION,
        'Invalid Kubernetes configuration: missing required field "metadata.name"',
        true,
        ['Add required metadata.name field', 'Use configuration template'],
        { validatedFields: ['spec', 'kind'], invalidFields: ['metadata'] },
        [FallbackOptions.USE_BASIC_TEMPLATE, FallbackOptions.MANUAL_CONFIGURATION]
      );

      expect(error.message).toContain('metadata.name');
      expect(error.partialResults?.validatedFields).toContain('spec');
      expect(error.partialResults?.invalidFields).toContain('metadata');
    });
  });
});
