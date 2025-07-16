import { CICDPlatform } from "./common";
import { InfrastructureRecommendations } from "./recommendations";

// Configuration generation interfaces

export interface DockerConfiguration {
  dockerfile: string;
  dockerignore: string;
  dockerCompose?: string;
  buildArgs: Record<string, string>;
  multistage: boolean;
  baseImage: string;
  optimizations: DockerOptimization[];
}

export interface DockerOptimization {
  type: "layer-caching" | "multi-stage" | "security" | "size";
  description: string;
  applied: boolean;
}

export interface KubernetesManifests {
  deployment: string;
  service: string;
  ingress?: string;
  configMap?: string;
  secret?: string;
  persistentVolumeClaim?: string;
  horizontalPodAutoscaler?: string;
}

export interface CICDConfiguration {
  platform: CICDPlatform;
  pipeline: string;
  stages: PipelineStage[];
  environmentVariables: Record<string, string>;
  secrets: string[];
}

export interface PipelineStage {
  name: string;
  type: "build" | "test" | "security" | "deploy" | "notify";
  steps: PipelineStep[];
  dependencies?: string[];
  condition?: string;
}

export interface PipelineStep {
  name: string;
  command: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  artifacts?: string[];
}

export interface GeneratedConfig {
  docker: DockerConfiguration;
  kubernetes: KubernetesManifests;
  cicd: CICDConfiguration[];
  recommendations: InfrastructureRecommendations;
  documentation: GeneratedDocumentation;
  metadata: ConfigMetadata;
}

export interface GeneratedDocumentation {
  setupInstructions: string;
  deploymentGuide: string;
  troubleshooting: string;
  bestPractices: string[];
}

export interface ConfigMetadata {
  generatedAt: Date;
  version: string;
  analysisHash: string;
  customizations: UserCustomizations;
}

export interface UserCustomizations {
  resourceLimits?: ResourceCustomization;
  environmentVariables?: Record<string, string>;
  scalingParameters?: ScalingCustomization;
  securitySettings?: SecurityCustomization;
  costConstraints?: CostConstraints;
}

export interface ResourceCustomization {
  cpu?: {
    requests: string;
    limits: string;
  };
  memory?: {
    requests: string;
    limits: string;
  };
  storage?: {
    size: string;
    class: string;
  };
}

export interface ScalingCustomization {
  minReplicas: number;
  maxReplicas: number;
  targetCPUUtilization: number;
  targetMemoryUtilization?: number;
}

export interface SecurityCustomization {
  runAsNonRoot: boolean;
  readOnlyRootFilesystem: boolean;
  allowPrivilegeEscalation: boolean;
  securityContext: Record<string, any>;
}

export interface CostConstraints {
  maxMonthlyCost: number;
  currency: string;
  optimizeFor: "cost" | "performance" | "balanced";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: Suggestion[];
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
