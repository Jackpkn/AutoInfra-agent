// Common types and enums used across the application

export type FileType =
  | "package"
  | "config"
  | "source"
  | "test"
  | "documentation"
  | "asset"
  | "build"
  | "schema";

export type ImportanceCategory = "critical" | "important" | "normal" | "ignore";

export type CloudProvider = "aws" | "gcp" | "azure";

export type CICDPlatform =
  | "github-actions"
  | "gitlab-ci"
  | "jenkins"
  | "azure-devops";

export type ArchitectureType = "monolith" | "microservices" | "serverless";

export type ErrorCategory =
  | "analysis"
  | "generation"
  | "validation"
  | "integration"
  | "recommendation";

export interface ImportanceScore {
  score: number;
  reasons: string[];
  category: ImportanceCategory;
}

export interface ResourceRange {
  min: number;
  max: number;
  recommended: number;
  unit: string;
}

export interface ResourceSpec {
  value: number;
  unit: string;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: "error" | "warning";
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface Suggestion {
  type: "optimization" | "security" | "cost" | "performance";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    category: ErrorCategory;
    recoverable: boolean;
    suggestions: string[];
  };
  partialResults?: any;
  fallbackOptions: FallbackOption[];
}

export interface FallbackOption {
  type: string;
  description: string;
  action: string;
}
