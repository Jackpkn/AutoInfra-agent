// Core type definitions and interfaces
export * from './codebase';
export * from './analysis';
export * from './recommendations';

// Export configuration types with explicit re-exports to avoid conflicts
export * from './configuration';

// Export common types, but handle conflicts explicitly
export {
  FileType,
  ImportanceCategory,
  CloudProvider,
  CICDPlatform,
  ArchitectureType,
  ErrorCategory,
  ImportanceScore,
  ResourceRange,
  ResourceSpec,
  ErrorResponse,
  FallbackOption,
  // Re-export Suggestion from common as CommonSuggestion to avoid conflict
  Suggestion as CommonSuggestion,
  ValidationError as CommonValidationError,
  ValidationWarning as CommonValidationWarning,
} from './common';
