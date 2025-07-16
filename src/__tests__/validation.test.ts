import { describe, it, expect } from 'vitest';
import { DefaultValidationUtils } from '../utils/validation';
import { CodebaseInput, AnalysisResult, TechStackInfo } from '../types';

describe('Validation Utils', () => {
  const validator = new DefaultValidationUtils();

  describe('validateCodebaseInput', () => {
    it('should validate a valid codebase input', () => {
      const validInput: CodebaseInput = {
        files: [
          {
            path: 'package.json',
            content: '{"name": "test"}',
            size: 100,
            type: 'package',
          },
        ],
        metadata: {
          name: 'test-project',
          description: 'A test project',
        },
      };

      const result = validator.validateCodebaseInput(validInput);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null/undefined input', () => {
      const result = validator.validateCodebaseInput(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_INPUT');
    });

    it('should reject input without files', () => {
      const invalidInput = {
        metadata: { name: 'test' },
      };

      const result = validator.validateCodebaseInput(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_FILES')).toBe(true);
    });

    it('should reject empty files array', () => {
      const invalidInput = {
        files: [],
        metadata: { name: 'test' },
      };

      const result = validator.validateCodebaseInput(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'EMPTY_FILES')).toBe(true);
    });

    it('should warn about missing metadata', () => {
      const inputWithoutMetadata = {
        files: [
          {
            path: 'index.js',
            content: 'console.log("hello")',
            size: 50,
            type: 'source' as const,
          },
        ],
      };

      const result = validator.validateCodebaseInput(inputWithoutMetadata);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_METADATA')).toBe(true);
    });

    it('should validate individual file entries', () => {
      const inputWithInvalidFiles = {
        files: [
          {
            // Missing path
            content: 'test',
            size: 10,
            type: 'source' as const,
          },
          {
            path: 'test.js',
            // Missing content
            size: 20,
            type: 'source' as const,
          },
        ],
        metadata: { name: 'test' },
      };

      const result = validator.validateCodebaseInput(inputWithInvalidFiles);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_FILE_PATH')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_FILE_CONTENT')).toBe(true);
    });
  });

  describe('validateTechStackInfo', () => {
    it('should validate a valid tech stack', () => {
      const validTechStack: TechStackInfo = {
        language: 'typescript',
        framework: 'express',
        runtime: {
          name: 'node',
          version: '18.0.0',
        },
        buildTool: 'npm',
        packageManager: 'npm',
      };

      const result = validator.validateTechStackInfo(validTechStack);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null/undefined tech stack', () => {
      const result = validator.validateTechStackInfo(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_TECH_STACK');
    });

    it('should require language', () => {
      const invalidTechStack = {
        framework: 'express',
        runtime: { name: 'node', version: '18.0.0' },
        buildTool: 'npm',
        packageManager: 'npm',
      };

      const result = validator.validateTechStackInfo(invalidTechStack);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_LANGUAGE')).toBe(true);
    });

    it('should require runtime information', () => {
      const invalidTechStack = {
        language: 'typescript',
        framework: 'express',
        buildTool: 'npm',
        packageManager: 'npm',
      };

      const result = validator.validateTechStackInfo(invalidTechStack);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_RUNTIME')).toBe(true);
    });

    it('should require runtime name', () => {
      const invalidTechStack = {
        language: 'typescript',
        framework: 'express',
        runtime: { version: '18.0.0' },
        buildTool: 'npm',
        packageManager: 'npm',
      };

      const result = validator.validateTechStackInfo(invalidTechStack);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_RUNTIME_NAME')).toBe(true);
    });

    it('should warn about missing optional fields', () => {
      const minimalTechStack = {
        language: 'typescript',
        runtime: { name: 'node' },
      };

      const result = validator.validateTechStackInfo(minimalTechStack);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_FRAMEWORK')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_BUILD_TOOL')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_PACKAGE_MANAGER')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_RUNTIME_VERSION')).toBe(true);
    });

    it('should validate version format', () => {
      const techStackWithInvalidVersion = {
        language: 'typescript',
        runtime: {
          name: 'node',
          version: 'invalid-version',
        },
      };

      const result = validator.validateTechStackInfo(techStackWithInvalidVersion);

      expect(result.warnings.some(w => w.code === 'INVALID_VERSION_FORMAT')).toBe(true);
    });

    it('should accept valid version formats', () => {
      const validVersions = ['1.0.0', '18.16.1', '2.1.0-beta.1', '1.0'];

      validVersions.forEach(version => {
        const techStack = {
          language: 'typescript',
          runtime: { name: 'node', version },
        };

        const result = validator.validateTechStackInfo(techStack);
        expect(result.warnings.some(w => w.code === 'INVALID_VERSION_FORMAT')).toBe(false);
      });
    });
  });

  describe('validateAnalysisResult', () => {
    it('should validate a valid analysis result', () => {
      const validAnalysisResult: AnalysisResult = {
        techStack: {
          language: 'typescript',
          framework: 'express',
          runtime: { name: 'node', version: '18.0.0' },
          buildTool: 'npm',
          packageManager: 'npm',
        },
        dependencies: {
          databases: [],
          caches: [],
          messageQueues: [],
          externalServices: [],
          internalServices: [],
        },
        architecture: {
          type: 'monolith',
          services: [],
          communicationPatterns: [],
          dataFlow: {
            dataSources: [],
            dataStores: [],
            dataTransformations: [],
          },
        },
        buildRequirements: {
          buildTool: 'npm',
          buildSteps: [],
          artifacts: [],
          dependencies: [],
        },
        runtimeRequirements: {
          runtime: { name: 'node', version: '18.0.0' },
          environmentVariables: {},
          systemDependencies: [],
          resourceRequirements: {
            cpu: { min: 0.1, max: 2, recommended: 0.5, unit: 'cores' },
            memory: { min: 128, max: 2048, recommended: 512, unit: 'MB' },
            storage: {
              persistent: false,
              size: { min: 1, max: 100, recommended: 10, unit: 'GB' },
              type: 'ssd',
              backup: false,
            },
            network: {
              inbound: [],
              outbound: [],
              bandwidth: { min: 1, max: 100, recommended: 10, unit: 'Mbps' },
            },
            scalability: {
              expectedLoad: {
                requestsPerSecond: { min: 1, max: 1000, recommended: 100, unit: 'rps' },
                concurrentUsers: { min: 1, max: 1000, recommended: 100, unit: 'users' },
                dataVolume: { min: 1, max: 1000, recommended: 100, unit: 'MB' },
              },
              scalingTriggers: [],
              maxInstances: 10,
              minInstances: 1,
            },
          },
        },
      };

      const result = validator.validateAnalysisResult(validAnalysisResult);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null/undefined analysis result', () => {
      const result = validator.validateAnalysisResult(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_RESULT');
    });

    it('should require tech stack', () => {
      const invalidResult = {
        dependencies: {
          databases: [],
          caches: [],
          messageQueues: [],
          externalServices: [],
          internalServices: [],
        },
        architecture: {
          type: 'monolith',
          services: [],
          communicationPatterns: [],
          dataFlow: { dataSources: [], dataStores: [], dataTransformations: [] },
        },
      };

      const result = validator.validateAnalysisResult(invalidResult);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_TECH_STACK')).toBe(true);
    });

    it('should require dependencies', () => {
      const invalidResult = {
        techStack: { language: 'typescript', runtime: { name: 'node' } },
        architecture: {
          type: 'monolith',
          services: [],
          communicationPatterns: [],
          dataFlow: { dataSources: [], dataStores: [], dataTransformations: [] },
        },
      };

      const result = validator.validateAnalysisResult(invalidResult);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_DEPENDENCIES')).toBe(true);
    });

    it('should require architecture', () => {
      const invalidResult = {
        techStack: { language: 'typescript', runtime: { name: 'node' } },
        dependencies: {
          databases: [],
          caches: [],
          messageQueues: [],
          externalServices: [],
          internalServices: [],
        },
      };

      const result = validator.validateAnalysisResult(invalidResult);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_ARCHITECTURE')).toBe(true);
    });

    it('should validate nested tech stack', () => {
      const resultWithInvalidTechStack = {
        techStack: { /* missing language */ runtime: { name: 'node' } },
        dependencies: {
          databases: [],
          caches: [],
          messageQueues: [],
          externalServices: [],
          internalServices: [],
        },
        architecture: {
          type: 'monolith',
          services: [],
          communicationPatterns: [],
          dataFlow: { dataSources: [], dataStores: [], dataTransformations: [] },
        },
      };

      const result = validator.validateAnalysisResult(resultWithInvalidTechStack);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_LANGUAGE')).toBe(true);
    });

    it('should warn about missing optional sections', () => {
      const minimalResult = {
        techStack: { language: 'typescript', runtime: { name: 'node' } },
        dependencies: {
          databases: [],
          caches: [],
          messageQueues: [],
          externalServices: [],
          internalServices: [],
        },
        architecture: {
          type: 'monolith',
          services: [],
          communicationPatterns: [],
          dataFlow: { dataSources: [], dataStores: [], dataTransformations: [] },
        },
      };

      const result = validator.validateAnalysisResult(minimalResult);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_BUILD_REQUIREMENTS')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_RUNTIME_REQUIREMENTS')).toBe(true);
    });
  });

  describe('serialization', () => {
    describe('CodebaseInput serialization', () => {
      it('should serialize and deserialize a valid codebase input', () => {
        const originalInput: CodebaseInput = {
          files: [
            {
              path: 'package.json',
              content: '{"name": "test-project", "version": "1.0.0"}',
              size: 100,
              type: 'package',
            },
            {
              path: 'src/index.ts',
              content: 'console.log("Hello, world!");',
              size: 50,
              type: 'source',
            },
          ],
          metadata: {
            name: 'test-project',
            description: 'A test project for serialization',
            repository: {
              url: 'https://github.com/test/test-project',
              branch: 'main',
              provider: 'github',
            },
            existingInfra: {
              hasDocker: false,
              hasKubernetes: false,
              hasCICD: false,
            },
          },
          preferences: {
            targetPlatform: 'kubernetes',
            cloudProvider: 'aws',
            costOptimization: true,
            securityFocus: true,
            performanceOptimization: false,
          },
        };

        const serialized = validator.serializeCodebaseInput(originalInput);
        expect(serialized).toBeTruthy();
        expect(typeof serialized).toBe('string');

        const deserialized = validator.deserializeCodebaseInput(serialized);
        expect(deserialized).toEqual(originalInput);
      });

      it('should handle minimal codebase input', () => {
        const minimalInput: CodebaseInput = {
          files: [
            {
              path: 'index.js',
              content: 'console.log("minimal");',
              size: 25,
              type: 'source',
            },
          ],
          metadata: {
            name: 'minimal-project',
          },
        };

        const serialized = validator.serializeCodebaseInput(minimalInput);
        const deserialized = validator.deserializeCodebaseInput(serialized);
        expect(deserialized).toEqual(minimalInput);
      });

      it('should throw error for invalid JSON during deserialization', () => {
        const invalidJson = '{"files": [invalid json}';

        expect(() => {
          validator.deserializeCodebaseInput(invalidJson);
        }).toThrow('Invalid JSON format');
      });

      it('should throw error for invalid codebase input during deserialization', () => {
        const invalidInput = JSON.stringify({ files: [] }); // Empty files array

        expect(() => {
          validator.deserializeCodebaseInput(invalidInput);
        }).toThrow('Invalid CodebaseInput JSON');
      });
    });

    describe('TechStackInfo serialization', () => {
      it('should serialize and deserialize a valid tech stack', () => {
        const originalTechStack: TechStackInfo = {
          language: 'typescript',
          framework: 'express',
          runtime: {
            name: 'node',
            version: '18.16.1',
            minVersion: '16.0.0',
            maxVersion: '20.0.0',
          },
          buildTool: 'npm',
          packageManager: 'npm',
          testFramework: 'vitest',
        };

        const serialized = validator.serializeTechStackInfo(originalTechStack);
        expect(serialized).toBeTruthy();
        expect(typeof serialized).toBe('string');

        const deserialized = validator.deserializeTechStackInfo(serialized);
        expect(deserialized).toEqual(originalTechStack);
      });

      it('should handle minimal tech stack', () => {
        const minimalTechStack: TechStackInfo = {
          language: 'javascript',
          framework: '',
          runtime: {
            name: 'node',
            version: '18.0.0',
          },
          buildTool: '',
          packageManager: '',
        };

        const serialized = validator.serializeTechStackInfo(minimalTechStack);
        const deserialized = validator.deserializeTechStackInfo(serialized);
        expect(deserialized).toEqual(minimalTechStack);
      });

      it('should throw error for invalid tech stack during deserialization', () => {
        const invalidTechStack = JSON.stringify({ runtime: { name: 'node' } }); // Missing language

        expect(() => {
          validator.deserializeTechStackInfo(invalidTechStack);
        }).toThrow('Invalid TechStackInfo JSON');
      });
    });

    describe('AnalysisResult serialization', () => {
      it('should serialize and deserialize a valid analysis result', () => {
        const originalResult: AnalysisResult = {
          techStack: {
            language: 'typescript',
            framework: 'express',
            runtime: { name: 'node', version: '18.0.0' },
            buildTool: 'npm',
            packageManager: 'npm',
          },
          dependencies: {
            databases: [
              {
                type: 'postgresql',
                version: '14.0',
                features: ['json', 'uuid'],
              },
            ],
            caches: [
              {
                type: 'redis',
                version: '7.0',
                configuration: { maxMemory: '256mb' },
              },
            ],
            messageQueues: [
              {
                type: 'rabbitmq',
                version: '3.11',
                topics: ['user.events', 'order.events'],
                configuration: { vhost: '/app' },
              },
            ],
            externalServices: [
              {
                name: 'payment-api',
                type: 'rest-api',
                endpoint: 'https://api.payment.com',
                authentication: {
                  type: 'bearer',
                  configuration: { tokenUrl: '/oauth/token' },
                },
              },
            ],
            internalServices: [
              {
                name: 'user-service',
                type: 'microservice',
                communicationMethod: 'http',
              },
            ],
          },
          architecture: {
            type: 'microservices',
            services: [
              {
                name: 'api-gateway',
                type: 'api',
                entryPoints: ['src/gateway.ts'],
                dependencies: ['user-service', 'order-service'],
                exposedPorts: [3000],
              },
            ],
            communicationPatterns: [
              {
                from: 'api-gateway',
                to: 'user-service',
                type: 'synchronous',
                protocol: 'http',
              },
            ],
            dataFlow: {
              dataSources: ['user-database', 'order-database'],
              dataStores: ['redis-cache'],
              dataTransformations: [
                {
                  input: 'user-events',
                  output: 'user-analytics',
                  type: 'stream',
                },
              ],
            },
          },
          buildRequirements: {
            buildTool: 'npm',
            buildSteps: [
              {
                name: 'install',
                command: 'npm install',
                environment: { NODE_ENV: 'production' },
              },
              {
                name: 'build',
                command: 'npm run build',
                workingDirectory: './src',
              },
            ],
            artifacts: [
              {
                name: 'app',
                path: './dist/app.js',
                type: 'executable',
              },
            ],
            dependencies: ['typescript', 'express'],
          },
          runtimeRequirements: {
            runtime: { name: 'node', version: '18.0.0' },
            environmentVariables: {
              NODE_ENV: 'production',
              PORT: '3000',
            },
            systemDependencies: ['curl', 'git'],
            resourceRequirements: {
              cpu: { min: 0.1, max: 2, recommended: 0.5, unit: 'cores' },
              memory: { min: 128, max: 2048, recommended: 512, unit: 'MB' },
              storage: {
                persistent: true,
                size: { min: 1, max: 100, recommended: 10, unit: 'GB' },
                type: 'ssd',
                backup: true,
              },
              network: {
                inbound: [
                  { port: 3000, protocol: 'http', public: true },
                  { port: 8080, protocol: 'tcp', public: false },
                ],
                outbound: [{ port: 5432, protocol: 'tcp', public: false }],
                bandwidth: { min: 1, max: 100, recommended: 10, unit: 'Mbps' },
              },
              scalability: {
                expectedLoad: {
                  requestsPerSecond: { min: 1, max: 1000, recommended: 100, unit: 'rps' },
                  concurrentUsers: { min: 1, max: 1000, recommended: 100, unit: 'users' },
                  dataVolume: { min: 1, max: 1000, recommended: 100, unit: 'MB' },
                  peakHours: ['09:00-12:00', '18:00-21:00'],
                },
                scalingTriggers: [
                  { metric: 'cpu', threshold: 80, action: 'scale-up' },
                  { metric: 'memory', threshold: 85, action: 'scale-up' },
                ],
                maxInstances: 10,
                minInstances: 2,
              },
            },
          },
        };

        const serialized = validator.serializeAnalysisResult(originalResult);
        expect(serialized).toBeTruthy();
        expect(typeof serialized).toBe('string');

        const deserialized = validator.deserializeAnalysisResult(serialized);
        expect(deserialized).toEqual(originalResult);
      });

      it('should throw error for invalid analysis result during deserialization', () => {
        const invalidResult = JSON.stringify({
          dependencies: {
            databases: [],
            caches: [],
            messageQueues: [],
            externalServices: [],
            internalServices: [],
          },
        }); // Missing techStack and architecture

        expect(() => {
          validator.deserializeAnalysisResult(invalidResult);
        }).toThrow('Invalid AnalysisResult JSON');
      });
    });
  });

  describe('validateGeneratedConfig', () => {
    it('should validate a valid generated configuration', () => {
      const validConfig = {
        docker: {
          dockerfile: 'FROM node:18\nCOPY . .\nRUN npm install\nCMD ["npm", "start"]',
          dockerignore: 'node_modules\n.git',
          baseImage: 'node:18',
          buildArgs: {},
          multistage: false,
          optimizations: [],
        },
        kubernetes: {
          deployment: 'apiVersion: apps/v1\nkind: Deployment',
          service: 'apiVersion: v1\nkind: Service',
        },
        cicd: [
          {
            platform: 'github-actions',
            pipeline: 'name: CI/CD',
            stages: [
              {
                name: 'build',
                type: 'build',
                steps: [{ name: 'Build', command: 'npm run build' }],
              },
            ],
            environmentVariables: {},
            secrets: [],
          },
        ],
        recommendations: {
          compute: {
            instanceType: 't3.medium',
            cpu: { value: 2, unit: 'cores' },
            memory: { value: 4, unit: 'GB' },
            alternatives: [],
            reasoning: 'Based on application requirements',
          },
          storage: {
            type: 'ssd',
            size: { value: 20, unit: 'GB' },
            iops: 3000,
            backup: { enabled: true, frequency: 'daily', retention: '7d', crossRegion: false },
            alternatives: [],
          },
          networking: {
            loadBalancer: {
              type: 'application',
              features: ['ssl-termination'],
              healthCheck: {
                path: '/health',
                interval: 30,
                timeout: 5,
                healthyThreshold: 2,
                unhealthyThreshold: 3,
              },
            },
            cdn: {
              enabled: false,
              provider: '',
              cachePolicy: { ttl: 0, cacheableContent: [], compressionEnabled: false },
              origins: [],
            },
            vpc: { cidr: '10.0.0.0/16', subnets: [], securityGroups: [] },
          },
          scaling: {
            autoScaling: {
              enabled: true,
              minInstances: 2,
              maxInstances: 10,
              targetMetrics: [],
              cooldownPeriod: 300,
            },
            loadTesting: { tools: [], scenarios: [], metrics: [] },
            monitoring: { metrics: [], alerts: [], dashboards: [] },
          },
          monitoring: {
            logging: {
              level: 'info',
              format: 'json',
              retention: '30d',
              aggregation: true,
              tools: [],
            },
            metrics: {
              collection: { interval: 60, metrics: [], customMetrics: [] },
              storage: { retention: '90d', compression: true, downsampling: [] },
              visualization: { dashboards: [], alerts: [] },
            },
            tracing: { enabled: false, samplingRate: 0.1, tools: [], instrumentation: [] },
            alerting: { channels: [], rules: [], escalation: { levels: [], timeout: 300 } },
          },
        },
        documentation: {
          setupInstructions: 'Setup instructions',
          deploymentGuide: 'Deployment guide',
          troubleshooting: 'Troubleshooting guide',
          bestPractices: [],
        },
        metadata: {
          generatedAt: new Date(),
          version: '1.0.0',
          analysisHash: 'abc123',
          customizations: {},
        },
      };

      const result = validator.validateGeneratedConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null/undefined generated config', () => {
      const result = validator.validateGeneratedConfig(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_CONFIG');
    });

    it('should require docker configuration', () => {
      const invalidConfig = {
        kubernetes: { deployment: 'test', service: 'test' },
      };

      const result = validator.validateGeneratedConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_DOCKER_CONFIG')).toBe(true);
    });

    it('should require kubernetes configuration', () => {
      const invalidConfig = {
        docker: { dockerfile: 'test', baseImage: 'node:18' },
      };

      const result = validator.validateGeneratedConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_K8S_CONFIG')).toBe(true);
    });

    it('should warn about missing optional sections', () => {
      const minimalConfig = {
        docker: { dockerfile: 'test', baseImage: 'node:18' },
        kubernetes: { deployment: 'test', service: 'test' },
      };

      const result = validator.validateGeneratedConfig(minimalConfig);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_CICD_CONFIG')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_RECOMMENDATIONS')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_METADATA')).toBe(true);
    });
  });

  describe('validateInfrastructureRecommendations', () => {
    it('should validate valid infrastructure recommendations', () => {
      const validRecommendations = {
        compute: {
          instanceType: 't3.medium',
          cpu: { value: 2, unit: 'cores' },
          memory: { value: 4, unit: 'GB' },
          alternatives: [],
          reasoning: 'Based on application requirements',
        },
        storage: {
          type: 'ssd',
          size: { value: 20, unit: 'GB' },
          iops: 3000,
          backup: { enabled: true, frequency: 'daily', retention: '7d', crossRegion: false },
          alternatives: [],
        },
        networking: {
          loadBalancer: {
            type: 'application',
            features: ['ssl-termination'],
            healthCheck: {
              path: '/health',
              interval: 30,
              timeout: 5,
              healthyThreshold: 2,
              unhealthyThreshold: 3,
            },
          },
          cdn: {
            enabled: false,
            provider: '',
            cachePolicy: { ttl: 0, cacheableContent: [], compressionEnabled: false },
            origins: [],
          },
          vpc: { cidr: '10.0.0.0/16', subnets: [], securityGroups: [] },
        },
        scaling: {
          autoScaling: {
            enabled: true,
            minInstances: 2,
            maxInstances: 10,
            targetMetrics: [],
            cooldownPeriod: 300,
          },
          loadTesting: { tools: [], scenarios: [], metrics: [] },
          monitoring: { metrics: [], alerts: [], dashboards: [] },
        },
        monitoring: {
          logging: {
            level: 'info',
            format: 'json',
            retention: '30d',
            aggregation: true,
            tools: [],
          },
          metrics: {
            collection: { interval: 60, metrics: [], customMetrics: [] },
            storage: { retention: '90d', compression: true, downsampling: [] },
            visualization: { dashboards: [], alerts: [] },
          },
          tracing: { enabled: false, samplingRate: 0.1, tools: [], instrumentation: [] },
          alerting: { channels: [], rules: [], escalation: { levels: [], timeout: 300 } },
        },
      };

      const result = validator.validateInfrastructureRecommendations(validRecommendations);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null/undefined recommendations', () => {
      const result = validator.validateInfrastructureRecommendations(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_RECOMMENDATIONS');
    });

    it('should require compute recommendations', () => {
      const invalidRecommendations = {
        storage: { type: 'ssd', size: { value: 20, unit: 'GB' } },
      };

      const result = validator.validateInfrastructureRecommendations(invalidRecommendations);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_COMPUTE_RECOMMENDATIONS')).toBe(true);
    });

    it('should require compute instance type, cpu, and memory', () => {
      const invalidRecommendations = {
        compute: {
          // Missing instanceType, cpu, memory
          alternatives: [],
          reasoning: 'test',
        },
      };

      const result = validator.validateInfrastructureRecommendations(invalidRecommendations);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_INSTANCE_TYPE')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_CPU_SPEC')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_MEMORY_SPEC')).toBe(true);
    });

    it('should warn about missing optional sections', () => {
      const minimalRecommendations = {
        compute: {
          instanceType: 't3.medium',
          cpu: { value: 2, unit: 'cores' },
          memory: { value: 4, unit: 'GB' },
          alternatives: [],
          reasoning: 'test',
        },
      };

      const result = validator.validateInfrastructureRecommendations(minimalRecommendations);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_STORAGE_RECOMMENDATIONS')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_NETWORKING_RECOMMENDATIONS')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_SCALING_RECOMMENDATIONS')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_MONITORING_RECOMMENDATIONS')).toBe(true);
    });

    it('should validate scaling parameters', () => {
      const recommendationsWithInvalidScaling = {
        compute: {
          instanceType: 't3.medium',
          cpu: { value: 2, unit: 'cores' },
          memory: { value: 4, unit: 'GB' },
          alternatives: [],
          reasoning: 'test',
        },
        scaling: {
          autoScaling: {
            enabled: true,
            minInstances: 0, // Invalid: should be at least 1
            maxInstances: 5,
            targetMetrics: [],
            cooldownPeriod: 300,
          },
        },
      };

      const result = validator.validateInfrastructureRecommendations(
        recommendationsWithInvalidScaling
      );

      expect(result.warnings.some(w => w.code === 'INVALID_MIN_INSTANCES')).toBe(true);
    });

    it('should validate max instances greater than min instances', () => {
      const recommendationsWithInvalidScaling = {
        compute: {
          instanceType: 't3.medium',
          cpu: { value: 2, unit: 'cores' },
          memory: { value: 4, unit: 'GB' },
          alternatives: [],
          reasoning: 'test',
        },
        scaling: {
          autoScaling: {
            enabled: true,
            minInstances: 5,
            maxInstances: 3, // Invalid: should be greater than minInstances
            targetMetrics: [],
            cooldownPeriod: 300,
          },
        },
      };

      const result = validator.validateInfrastructureRecommendations(
        recommendationsWithInvalidScaling
      );

      expect(result.warnings.some(w => w.code === 'INVALID_MAX_INSTANCES')).toBe(true);
    });
  });

  describe('validateUserCustomizations', () => {
    it('should validate valid user customizations', () => {
      const validCustomizations = {
        resourceLimits: {
          cpu: { requests: '100m', limits: '500m' },
          memory: { requests: '128Mi', limits: '512Mi' },
          storage: { size: '10Gi', class: 'gp2' },
        },
        environmentVariables: { NODE_ENV: 'production' },
        scalingParameters: {
          minReplicas: 2,
          maxReplicas: 10,
          targetCPUUtilization: 70,
          targetMemoryUtilization: 80,
        },
        securitySettings: {
          runAsNonRoot: true,
          readOnlyRootFilesystem: true,
          allowPrivilegeEscalation: false,
          securityContext: {},
        },
        costConstraints: {
          maxMonthlyCost: 500,
          currency: 'USD',
          optimizeFor: 'balanced',
        },
      };

      const result = validator.validateUserCustomizations(validCustomizations);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle null/undefined customizations', () => {
      const result = validator.validateUserCustomizations(null);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate scaling parameters', () => {
      const invalidCustomizations = {
        scalingParameters: {
          minReplicas: 0, // Invalid: should be at least 1
          maxReplicas: 5,
          targetCPUUtilization: 70,
        },
      };

      const result = validator.validateUserCustomizations(invalidCustomizations);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_MIN_REPLICAS')).toBe(true);
    });

    it('should validate max replicas greater than min replicas', () => {
      const invalidCustomizations = {
        scalingParameters: {
          minReplicas: 5,
          maxReplicas: 3, // Invalid: should be greater than minReplicas
          targetCPUUtilization: 70,
        },
      };

      const result = validator.validateUserCustomizations(invalidCustomizations);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_MAX_REPLICAS')).toBe(true);
    });

    it('should validate CPU utilization range', () => {
      const invalidCustomizations = {
        scalingParameters: {
          minReplicas: 1,
          maxReplicas: 5,
          targetCPUUtilization: 150, // Invalid: should be between 1 and 100
        },
      };

      const result = validator.validateUserCustomizations(invalidCustomizations);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_CPU_UTILIZATION')).toBe(true);
    });

    it('should validate cost constraints', () => {
      const invalidCustomizations = {
        costConstraints: {
          maxMonthlyCost: -100, // Invalid: should be greater than 0
          currency: 'USD',
          optimizeFor: 'cost',
        },
      };

      const result = validator.validateUserCustomizations(invalidCustomizations);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_MAX_COST')).toBe(true);
    });

    it('should warn about missing optional fields', () => {
      const minimalCustomizations = {
        resourceLimits: {
          cpu: {}, // Missing requests and limits
          memory: {}, // Missing requests and limits
        },
        costConstraints: {
          maxMonthlyCost: 500,
          // Missing currency and optimizeFor
        },
        securitySettings: {
          // Missing boolean settings
          securityContext: {},
        },
      };

      const result = validator.validateUserCustomizations(minimalCustomizations);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_CPU_REQUESTS')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_CPU_LIMITS')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_MEMORY_REQUESTS')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_MEMORY_LIMITS')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_CURRENCY')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_OPTIMIZATION_PREFERENCE')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_RUN_AS_NON_ROOT')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_READ_ONLY_ROOT_FS')).toBe(true);
    });
  });
});
