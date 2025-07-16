import { ValidationResult, ValidationError, ValidationWarning } from '../types/configuration';
import { CodebaseInput, AnalysisResult, TechStackInfo } from '../types';

/**
 * Interface for validation utilities
 */
export interface ValidationUtils {
  /**
   * Validates a codebase input
   */
  validateCodebaseInput(input: any): ValidationResult;

  /**
   * Validates an analysis result
   */
  validateAnalysisResult(result: any): ValidationResult;

  /**
   * Validates tech stack information
   */
  validateTechStackInfo(techStack: any): ValidationResult;

  /**
   * Validates generated Docker configuration
   */
  validateDockerConfig(config: any): ValidationResult;

  /**
   * Validates generated Kubernetes manifests
   */
  validateKubernetesManifests(manifests: any): ValidationResult;

  /**
   * Validates CI/CD pipeline configuration
   */
  validateCICDConfig(config: any): ValidationResult;

  /**
   * Validates generated configuration
   */
  validateGeneratedConfig(config: any): ValidationResult;

  /**
   * Validates infrastructure recommendations
   */
  validateInfrastructureRecommendations(recommendations: any): ValidationResult;

  /**
   * Validates user customizations
   */
  validateUserCustomizations(customizations: any): ValidationResult;

  /**
   * Serializes a codebase input to JSON
   */
  serializeCodebaseInput(input: CodebaseInput): string;

  /**
   * Deserializes a codebase input from JSON
   */
  deserializeCodebaseInput(json: string): CodebaseInput;

  /**
   * Serializes an analysis result to JSON
   */
  serializeAnalysisResult(result: AnalysisResult): string;

  /**
   * Deserializes an analysis result from JSON
   */
  deserializeAnalysisResult(json: string): AnalysisResult;

  /**
   * Serializes tech stack info to JSON
   */
  serializeTechStackInfo(techStack: TechStackInfo): string;

  /**
   * Deserializes tech stack info from JSON
   */
  deserializeTechStackInfo(json: string): TechStackInfo;

  /**
   * Creates a validation error
   */
  createError(code: string, message: string, field?: string): ValidationError;

  /**
   * Creates a validation warning
   */
  createWarning(
    code: string,
    message: string,
    field?: string,
    suggestion?: string
  ): ValidationWarning;
}

/**
 * Default implementation of ValidationUtils
 */
export class DefaultValidationUtils implements ValidationUtils {
  validateCodebaseInput(input: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!input) {
      errors.push(this.createError('MISSING_INPUT', 'Codebase input is required'));
      return { isValid: false, errors, warnings, suggestions: [] };
    }

    if (!input.files || !Array.isArray(input.files)) {
      errors.push(this.createError('MISSING_FILES', 'Files array is required', 'files'));
    } else if (input.files.length === 0) {
      errors.push(this.createError('EMPTY_FILES', 'At least one file is required', 'files'));
    }

    if (!input.metadata) {
      warnings.push(
        this.createWarning(
          'MISSING_METADATA',
          'Metadata is recommended for better analysis',
          'metadata'
        )
      );
    } else {
      if (!input.metadata.name) {
        warnings.push(
          this.createWarning('MISSING_NAME', 'Project name is recommended', 'metadata.name')
        );
      }
    }

    // Validate individual files
    if (input.files && Array.isArray(input.files)) {
      input.files.forEach((file: any, index: number) => {
        if (!file.path) {
          errors.push(
            this.createError('MISSING_FILE_PATH', 'File path is required', `files[${index}].path`)
          );
        }
        if (file.content === undefined || file.content === null) {
          errors.push(
            this.createError(
              'MISSING_FILE_CONTENT',
              'File content is required',
              `files[${index}].content`
            )
          );
        }
        if (typeof file.size !== 'number' || file.size < 0) {
          warnings.push(
            this.createWarning(
              'INVALID_FILE_SIZE',
              'File size should be a positive number',
              `files[${index}].size`
            )
          );
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
    };
  }

  validateAnalysisResult(result: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!result) {
      errors.push(this.createError('MISSING_RESULT', 'Analysis result is required'));
      return { isValid: false, errors, warnings, suggestions: [] };
    }

    // Validate tech stack
    if (!result.techStack) {
      errors.push(
        this.createError('MISSING_TECH_STACK', 'Tech stack information is required', 'techStack')
      );
    } else {
      const techStackValidation = this.validateTechStackInfo(result.techStack);
      errors.push(...techStackValidation.errors);
      warnings.push(...techStackValidation.warnings);
    }

    // Validate dependencies
    if (!result.dependencies) {
      errors.push(
        this.createError(
          'MISSING_DEPENDENCIES',
          'Dependencies information is required',
          'dependencies'
        )
      );
    } else {
      if (!Array.isArray(result.dependencies.databases)) {
        warnings.push(
          this.createWarning(
            'INVALID_DATABASES',
            'Databases should be an array',
            'dependencies.databases'
          )
        );
      }
      if (!Array.isArray(result.dependencies.caches)) {
        warnings.push(
          this.createWarning('INVALID_CACHES', 'Caches should be an array', 'dependencies.caches')
        );
      }
      if (!Array.isArray(result.dependencies.messageQueues)) {
        warnings.push(
          this.createWarning(
            'INVALID_MESSAGE_QUEUES',
            'Message queues should be an array',
            'dependencies.messageQueues'
          )
        );
      }
    }

    // Validate architecture
    if (!result.architecture) {
      errors.push(
        this.createError(
          'MISSING_ARCHITECTURE',
          'Architecture information is required',
          'architecture'
        )
      );
    } else {
      if (!result.architecture.type) {
        errors.push(
          this.createError(
            'MISSING_ARCHITECTURE_TYPE',
            'Architecture type is required',
            'architecture.type'
          )
        );
      }
      if (!Array.isArray(result.architecture.services)) {
        warnings.push(
          this.createWarning(
            'INVALID_SERVICES',
            'Services should be an array',
            'architecture.services'
          )
        );
      }
    }

    // Validate build requirements
    if (!result.buildRequirements) {
      warnings.push(
        this.createWarning(
          'MISSING_BUILD_REQUIREMENTS',
          'Build requirements are recommended',
          'buildRequirements'
        )
      );
    } else {
      if (!result.buildRequirements.buildTool) {
        warnings.push(
          this.createWarning(
            'MISSING_BUILD_TOOL',
            'Build tool information is recommended',
            'buildRequirements.buildTool'
          )
        );
      }
    }

    // Validate runtime requirements
    if (!result.runtimeRequirements) {
      warnings.push(
        this.createWarning(
          'MISSING_RUNTIME_REQUIREMENTS',
          'Runtime requirements are recommended',
          'runtimeRequirements'
        )
      );
    } else {
      if (!result.runtimeRequirements.runtime) {
        warnings.push(
          this.createWarning(
            'MISSING_RUNTIME_INFO',
            'Runtime information is recommended',
            'runtimeRequirements.runtime'
          )
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
    };
  }

  validateTechStackInfo(techStack: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!techStack) {
      errors.push(this.createError('MISSING_TECH_STACK', 'Tech stack information is required'));
      return { isValid: false, errors, warnings, suggestions: [] };
    }

    // Validate required fields
    if (!techStack.language) {
      errors.push(
        this.createError('MISSING_LANGUAGE', 'Programming language is required', 'language')
      );
    }

    if (!techStack.framework) {
      warnings.push(
        this.createWarning('MISSING_FRAMEWORK', 'Framework information is recommended', 'framework')
      );
    }

    if (!techStack.runtime) {
      errors.push(
        this.createError('MISSING_RUNTIME', 'Runtime information is required', 'runtime')
      );
    } else {
      if (!techStack.runtime.name) {
        errors.push(
          this.createError('MISSING_RUNTIME_NAME', 'Runtime name is required', 'runtime.name')
        );
      }
      if (!techStack.runtime.version) {
        warnings.push(
          this.createWarning(
            'MISSING_RUNTIME_VERSION',
            'Runtime version is recommended for better compatibility',
            'runtime.version'
          )
        );
      }
    }

    if (!techStack.buildTool) {
      warnings.push(
        this.createWarning(
          'MISSING_BUILD_TOOL',
          'Build tool information is recommended',
          'buildTool'
        )
      );
    }

    if (!techStack.packageManager) {
      warnings.push(
        this.createWarning(
          'MISSING_PACKAGE_MANAGER',
          'Package manager information is recommended',
          'packageManager'
        )
      );
    }

    // Validate runtime version format if provided
    if (techStack.runtime && techStack.runtime.version) {
      const versionPattern = /^\d+(\.\d+)*(-.*)?$/;
      if (!versionPattern.test(techStack.runtime.version)) {
        warnings.push(
          this.createWarning(
            'INVALID_VERSION_FORMAT',
            'Runtime version should follow semantic versioning',
            'runtime.version'
          )
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
    };
  }

  validateDockerConfig(config: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!config) {
      errors.push(this.createError('MISSING_CONFIG', 'Docker configuration is required'));
      return { isValid: false, errors, warnings, suggestions: [] };
    }

    if (!config.dockerfile) {
      errors.push(
        this.createError('MISSING_DOCKERFILE', 'Dockerfile content is required', 'dockerfile')
      );
    }

    if (!config.baseImage) {
      errors.push(this.createError('MISSING_BASE_IMAGE', 'Base image is required', 'baseImage'));
    }

    if (!config.dockerignore) {
      warnings.push(
        this.createWarning(
          'MISSING_DOCKERIGNORE',
          'Dockerignore file is recommended for optimization',
          'dockerignore'
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
    };
  }

  validateKubernetesManifests(manifests: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!manifests) {
      errors.push(this.createError('MISSING_MANIFESTS', 'Kubernetes manifests are required'));
      return { isValid: false, errors, warnings, suggestions: [] };
    }

    if (!manifests.deployment) {
      errors.push(
        this.createError('MISSING_DEPLOYMENT', 'Deployment manifest is required', 'deployment')
      );
    }

    if (!manifests.service) {
      errors.push(this.createError('MISSING_SERVICE', 'Service manifest is required', 'service'));
    }

    if (!manifests.ingress) {
      warnings.push(
        this.createWarning(
          'MISSING_INGRESS',
          'Ingress manifest is recommended for external access',
          'ingress'
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
    };
  }

  validateCICDConfig(config: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!config) {
      errors.push(this.createError('MISSING_CONFIG', 'CI/CD configuration is required'));
      return { isValid: false, errors, warnings, suggestions: [] };
    }

    if (!config.platform) {
      errors.push(this.createError('MISSING_PLATFORM', 'CI/CD platform is required', 'platform'));
    }

    if (!config.pipeline) {
      errors.push(
        this.createError('MISSING_PIPELINE', 'Pipeline configuration is required', 'pipeline')
      );
    }

    if (!config.stages || !Array.isArray(config.stages) || config.stages.length === 0) {
      errors.push(
        this.createError('MISSING_STAGES', 'At least one pipeline stage is required', 'stages')
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
    };
  }

  validateGeneratedConfig(config: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!config) {
      errors.push(this.createError('MISSING_CONFIG', 'Generated configuration is required'));
      return { isValid: false, errors, warnings, suggestions: [] };
    }

    // Validate Docker configuration
    if (!config.docker) {
      errors.push(
        this.createError('MISSING_DOCKER_CONFIG', 'Docker configuration is required', 'docker')
      );
    } else {
      const dockerValidation = this.validateDockerConfig(config.docker);
      errors.push(...dockerValidation.errors);
      warnings.push(...dockerValidation.warnings);
    }

    // Validate Kubernetes manifests
    if (!config.kubernetes) {
      errors.push(
        this.createError('MISSING_K8S_CONFIG', 'Kubernetes configuration is required', 'kubernetes')
      );
    } else {
      const k8sValidation = this.validateKubernetesManifests(config.kubernetes);
      errors.push(...k8sValidation.errors);
      warnings.push(...k8sValidation.warnings);
    }

    // Validate CI/CD configurations
    if (!config.cicd || !Array.isArray(config.cicd)) {
      warnings.push(
        this.createWarning('MISSING_CICD_CONFIG', 'CI/CD configuration is recommended', 'cicd')
      );
    } else {
      config.cicd.forEach((cicdConfig: any, index: number) => {
        const cicdValidation = this.validateCICDConfig(cicdConfig);
        errors.push(
          ...cicdValidation.errors.map(error => ({
            ...error,
            field: error.field ? `cicd[${index}].${error.field}` : `cicd[${index}]`,
          }))
        );
        warnings.push(
          ...cicdValidation.warnings.map(warning => ({
            ...warning,
            field: warning.field ? `cicd[${index}].${warning.field}` : `cicd[${index}]`,
          }))
        );
      });
    }

    // Validate recommendations
    if (!config.recommendations) {
      warnings.push(
        this.createWarning(
          'MISSING_RECOMMENDATIONS',
          'Infrastructure recommendations are recommended',
          'recommendations'
        )
      );
    } else {
      const recommendationsValidation = this.validateInfrastructureRecommendations(
        config.recommendations
      );
      errors.push(...recommendationsValidation.errors);
      warnings.push(...recommendationsValidation.warnings);
    }

    // Validate metadata
    if (!config.metadata) {
      warnings.push(
        this.createWarning('MISSING_METADATA', 'Configuration metadata is recommended', 'metadata')
      );
    } else {
      if (!config.metadata.generatedAt) {
        warnings.push(
          this.createWarning(
            'MISSING_GENERATED_AT',
            'Generation timestamp is recommended',
            'metadata.generatedAt'
          )
        );
      }
      if (!config.metadata.version) {
        warnings.push(
          this.createWarning(
            'MISSING_VERSION',
            'Configuration version is recommended',
            'metadata.version'
          )
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
    };
  }

  validateInfrastructureRecommendations(recommendations: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!recommendations) {
      errors.push(
        this.createError('MISSING_RECOMMENDATIONS', 'Infrastructure recommendations are required')
      );
      return { isValid: false, errors, warnings, suggestions: [] };
    }

    // Validate compute recommendations
    if (!recommendations.compute) {
      errors.push(
        this.createError(
          'MISSING_COMPUTE_RECOMMENDATIONS',
          'Compute recommendations are required',
          'compute'
        )
      );
    } else {
      if (!recommendations.compute.instanceType) {
        errors.push(
          this.createError(
            'MISSING_INSTANCE_TYPE',
            'Instance type is required',
            'compute.instanceType'
          )
        );
      }
      if (!recommendations.compute.cpu) {
        errors.push(
          this.createError('MISSING_CPU_SPEC', 'CPU specification is required', 'compute.cpu')
        );
      }
      if (!recommendations.compute.memory) {
        errors.push(
          this.createError(
            'MISSING_MEMORY_SPEC',
            'Memory specification is required',
            'compute.memory'
          )
        );
      }
    }

    // Validate storage recommendations
    if (!recommendations.storage) {
      warnings.push(
        this.createWarning(
          'MISSING_STORAGE_RECOMMENDATIONS',
          'Storage recommendations are recommended',
          'storage'
        )
      );
    } else {
      if (!recommendations.storage.type) {
        warnings.push(
          this.createWarning('MISSING_STORAGE_TYPE', 'Storage type is recommended', 'storage.type')
        );
      }
      if (!recommendations.storage.size) {
        warnings.push(
          this.createWarning('MISSING_STORAGE_SIZE', 'Storage size is recommended', 'storage.size')
        );
      }
    }

    // Validate networking recommendations
    if (!recommendations.networking) {
      warnings.push(
        this.createWarning(
          'MISSING_NETWORKING_RECOMMENDATIONS',
          'Networking recommendations are recommended',
          'networking'
        )
      );
    }

    // Validate scaling recommendations
    if (!recommendations.scaling) {
      warnings.push(
        this.createWarning(
          'MISSING_SCALING_RECOMMENDATIONS',
          'Scaling recommendations are recommended',
          'scaling'
        )
      );
    } else {
      if (recommendations.scaling.autoScaling) {
        if (
          typeof recommendations.scaling.autoScaling.minInstances !== 'number' ||
          recommendations.scaling.autoScaling.minInstances < 1
        ) {
          warnings.push(
            this.createWarning(
              'INVALID_MIN_INSTANCES',
              'Minimum instances should be at least 1',
              'scaling.autoScaling.minInstances'
            )
          );
        }
        if (
          typeof recommendations.scaling.autoScaling.maxInstances !== 'number' ||
          recommendations.scaling.autoScaling.maxInstances <
            recommendations.scaling.autoScaling.minInstances
        ) {
          warnings.push(
            this.createWarning(
              'INVALID_MAX_INSTANCES',
              'Maximum instances should be greater than minimum instances',
              'scaling.autoScaling.maxInstances'
            )
          );
        }
      }
    }

    // Validate monitoring recommendations
    if (!recommendations.monitoring) {
      warnings.push(
        this.createWarning(
          'MISSING_MONITORING_RECOMMENDATIONS',
          'Monitoring recommendations are recommended',
          'monitoring'
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
    };
  }

  validateUserCustomizations(customizations: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!customizations) {
      // Customizations are optional, so this is not an error
      return { isValid: true, errors, warnings, suggestions: [] };
    }

    // Validate resource limits
    if (customizations.resourceLimits) {
      if (customizations.resourceLimits.cpu) {
        if (!customizations.resourceLimits.cpu.requests) {
          warnings.push(
            this.createWarning(
              'MISSING_CPU_REQUESTS',
              'CPU requests are recommended',
              'resourceLimits.cpu.requests'
            )
          );
        }
        if (!customizations.resourceLimits.cpu.limits) {
          warnings.push(
            this.createWarning(
              'MISSING_CPU_LIMITS',
              'CPU limits are recommended',
              'resourceLimits.cpu.limits'
            )
          );
        }
      }
      if (customizations.resourceLimits.memory) {
        if (!customizations.resourceLimits.memory.requests) {
          warnings.push(
            this.createWarning(
              'MISSING_MEMORY_REQUESTS',
              'Memory requests are recommended',
              'resourceLimits.memory.requests'
            )
          );
        }
        if (!customizations.resourceLimits.memory.limits) {
          warnings.push(
            this.createWarning(
              'MISSING_MEMORY_LIMITS',
              'Memory limits are recommended',
              'resourceLimits.memory.limits'
            )
          );
        }
      }
    }

    // Validate scaling parameters
    if (customizations.scalingParameters) {
      if (
        typeof customizations.scalingParameters.minReplicas !== 'number' ||
        customizations.scalingParameters.minReplicas < 1
      ) {
        errors.push(
          this.createError(
            'INVALID_MIN_REPLICAS',
            'Minimum replicas must be at least 1',
            'scalingParameters.minReplicas'
          )
        );
      }
      if (
        typeof customizations.scalingParameters.maxReplicas !== 'number' ||
        customizations.scalingParameters.maxReplicas < customizations.scalingParameters.minReplicas
      ) {
        errors.push(
          this.createError(
            'INVALID_MAX_REPLICAS',
            'Maximum replicas must be greater than minimum replicas',
            'scalingParameters.maxReplicas'
          )
        );
      }
      if (
        typeof customizations.scalingParameters.targetCPUUtilization !== 'number' ||
        customizations.scalingParameters.targetCPUUtilization <= 0 ||
        customizations.scalingParameters.targetCPUUtilization > 100
      ) {
        errors.push(
          this.createError(
            'INVALID_CPU_UTILIZATION',
            'Target CPU utilization must be between 1 and 100',
            'scalingParameters.targetCPUUtilization'
          )
        );
      }
    }

    // Validate cost constraints
    if (customizations.costConstraints) {
      if (
        typeof customizations.costConstraints.maxMonthlyCost !== 'number' ||
        customizations.costConstraints.maxMonthlyCost <= 0
      ) {
        errors.push(
          this.createError(
            'INVALID_MAX_COST',
            'Maximum monthly cost must be greater than 0',
            'costConstraints.maxMonthlyCost'
          )
        );
      }
      if (!customizations.costConstraints.currency) {
        warnings.push(
          this.createWarning(
            'MISSING_CURRENCY',
            'Currency specification is recommended',
            'costConstraints.currency'
          )
        );
      }
      if (!customizations.costConstraints.optimizeFor) {
        warnings.push(
          this.createWarning(
            'MISSING_OPTIMIZATION_PREFERENCE',
            'Optimization preference is recommended',
            'costConstraints.optimizeFor'
          )
        );
      }
    }

    // Validate security settings
    if (customizations.securitySettings) {
      if (typeof customizations.securitySettings.runAsNonRoot !== 'boolean') {
        warnings.push(
          this.createWarning(
            'MISSING_RUN_AS_NON_ROOT',
            'runAsNonRoot setting is recommended',
            'securitySettings.runAsNonRoot'
          )
        );
      }
      if (typeof customizations.securitySettings.readOnlyRootFilesystem !== 'boolean') {
        warnings.push(
          this.createWarning(
            'MISSING_READ_ONLY_ROOT_FS',
            'readOnlyRootFilesystem setting is recommended',
            'securitySettings.readOnlyRootFilesystem'
          )
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
    };
  }

  serializeCodebaseInput(input: CodebaseInput): string {
    try {
      // Convert Map objects to plain objects for JSON serialization
      const serializable = {
        ...input,
        files: input.files.map(file => ({
          ...file,
          // Ensure all properties are serializable
        })),
        metadata: input.metadata
          ? {
              ...input.metadata,
              repository: input.metadata.repository
                ? {
                    ...input.metadata.repository,
                  }
                : undefined,
              existingInfra: input.metadata.existingInfra
                ? {
                    ...input.metadata.existingInfra,
                  }
                : undefined,
            }
          : undefined,
        preferences: input.preferences
          ? {
              ...input.preferences,
            }
          : undefined,
      };

      return JSON.stringify(serializable, null, 2);
    } catch (error) {
      throw new Error(
        `Failed to serialize CodebaseInput: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  deserializeCodebaseInput(json: string): CodebaseInput {
    try {
      const parsed = JSON.parse(json);

      // Validate the parsed object
      const validation = this.validateCodebaseInput(parsed);
      if (!validation.isValid) {
        throw new Error(
          `Invalid CodebaseInput JSON: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      return parsed as CodebaseInput;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format: ${error.message}`);
      }
      throw error;
    }
  }

  serializeAnalysisResult(result: AnalysisResult): string {
    try {
      // Ensure all nested objects are serializable
      const serializable = {
        ...result,
        techStack: {
          ...result.techStack,
          runtime: {
            ...result.techStack.runtime,
          },
        },
        dependencies: {
          ...result.dependencies,
          databases: result.dependencies.databases.map(db => ({ ...db })),
          caches: result.dependencies.caches.map(cache => ({ ...cache })),
          messageQueues: result.dependencies.messageQueues.map(mq => ({ ...mq })),
          externalServices: result.dependencies.externalServices.map(service => ({ ...service })),
          internalServices: result.dependencies.internalServices.map(service => ({ ...service })),
        },
        architecture: {
          ...result.architecture,
          services: result.architecture.services.map(service => ({ ...service })),
          communicationPatterns: result.architecture.communicationPatterns.map(pattern => ({
            ...pattern,
          })),
          dataFlow: {
            ...result.architecture.dataFlow,
            dataTransformations: result.architecture.dataFlow.dataTransformations.map(
              transform => ({ ...transform })
            ),
          },
        },
        buildRequirements: {
          ...result.buildRequirements,
          buildSteps: result.buildRequirements.buildSteps.map(step => ({ ...step })),
          artifacts: result.buildRequirements.artifacts.map(artifact => ({ ...artifact })),
        },
        runtimeRequirements: {
          ...result.runtimeRequirements,
          runtime: {
            ...result.runtimeRequirements.runtime,
          },
          resourceRequirements: {
            ...result.runtimeRequirements.resourceRequirements,
            cpu: { ...result.runtimeRequirements.resourceRequirements.cpu },
            memory: { ...result.runtimeRequirements.resourceRequirements.memory },
            storage: { ...result.runtimeRequirements.resourceRequirements.storage },
            network: {
              ...result.runtimeRequirements.resourceRequirements.network,
              inbound: result.runtimeRequirements.resourceRequirements.network.inbound.map(
                port => ({ ...port })
              ),
              outbound: result.runtimeRequirements.resourceRequirements.network.outbound.map(
                port => ({ ...port })
              ),
            },
            scalability: {
              ...result.runtimeRequirements.resourceRequirements.scalability,
              expectedLoad: {
                ...result.runtimeRequirements.resourceRequirements.scalability.expectedLoad,
              },
              scalingTriggers:
                result.runtimeRequirements.resourceRequirements.scalability.scalingTriggers.map(
                  trigger => ({ ...trigger })
                ),
            },
          },
        },
      };

      return JSON.stringify(serializable, null, 2);
    } catch (error) {
      throw new Error(
        `Failed to serialize AnalysisResult: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  deserializeAnalysisResult(json: string): AnalysisResult {
    try {
      const parsed = JSON.parse(json);

      // Validate the parsed object
      const validation = this.validateAnalysisResult(parsed);
      if (!validation.isValid) {
        throw new Error(
          `Invalid AnalysisResult JSON: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      return parsed as AnalysisResult;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format: ${error.message}`);
      }
      throw error;
    }
  }

  serializeTechStackInfo(techStack: TechStackInfo): string {
    try {
      const serializable = {
        ...techStack,
        runtime: {
          ...techStack.runtime,
        },
      };

      return JSON.stringify(serializable, null, 2);
    } catch (error) {
      throw new Error(
        `Failed to serialize TechStackInfo: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  deserializeTechStackInfo(json: string): TechStackInfo {
    try {
      const parsed = JSON.parse(json);

      // Validate the parsed object
      const validation = this.validateTechStackInfo(parsed);
      if (!validation.isValid) {
        throw new Error(
          `Invalid TechStackInfo JSON: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      return parsed as TechStackInfo;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format: ${error.message}`);
      }
      throw error;
    }
  }

  createError(code: string, message: string, field?: string): ValidationError {
    return {
      code,
      message,
      field,
      severity: 'error',
    };
  }

  createWarning(
    code: string,
    message: string,
    field?: string,
    suggestion?: string
  ): ValidationWarning {
    return {
      code,
      message,
      field,
      suggestion,
    };
  }
}
