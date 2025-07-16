import { describe, it, expect, beforeEach } from 'vitest';
import {
  FilePriorityClassifier,
  PriorityClassifierOptions,
  ProjectType,
  PriorityScoringRule,
} from '../analyzers/file-priority-classifier';
import { FileIndexEntry } from '../types/codebase';

describe('FilePriorityClassifier', () => {
  let classifier: FilePriorityClassifier;

  beforeEach(() => {
    classifier = new FilePriorityClassifier();
  });

  describe('classifyFile', () => {
    it('should classify package files as critical', () => {
      const result = classifier.classifyFile('package.json', '{"name": "test"}');

      expect(result.importance.category).toBe('critical');
      expect(result.importance.score).toBeGreaterThan(100);
      expect(result.importance.reasons).toContain('Package/dependency definition');
      expect(result.characteristics.isPackageDefinition).toBe(true);
    });

    it('should classify entry points as critical', () => {
      const result = classifier.classifyFile('src/index.ts', 'console.log("entry point");');

      expect(result.importance.category).toBe('critical');
      expect(result.importance.score).toBeGreaterThan(90);
      expect(result.importance.reasons).toContain('Application entry point');
      expect(result.characteristics.isEntryPoint).toBe(true);
    });

    it('should classify configuration files as important', () => {
      const result = classifier.classifyFile('webpack.config.js', 'module.exports = {};');

      expect(result.importance.category).toBe('important');
      expect(result.importance.score).toBeGreaterThan(60);
      expect(result.importance.reasons).toContain('Configuration file');
      expect(result.characteristics.isConfiguration).toBe(true);
    });

    it('should classify schema files as important', () => {
      const result = classifier.classifyFile('api/schema.json', '{"type": "object"}');

      expect(result.importance.category).toBe('important');
      expect(result.importance.reasons).toContain('Schema/API definition');
      expect(result.characteristics.isSchema).toBe(true);
    });

    it('should classify infrastructure files appropriately', () => {
      const result = classifier.classifyFile('Dockerfile', 'FROM node:18');

      expect(result.importance.category).toBe('important');
      expect(result.importance.reasons).toContain('Infrastructure configuration');
      expect(result.characteristics.isInfrastructure).toBe(true);
    });

    it('should reduce score for test files', () => {
      const testResult = classifier.classifyFile(
        'src/utils.test.ts',
        'describe("test", () => {});'
      );
      const sourceResult = classifier.classifyFile('src/utils.ts', 'export function helper() {}');

      expect(testResult.importance.score).toBeLessThan(sourceResult.importance.score);
      expect(testResult.characteristics.isTest).toBe(true);
      expect(testResult.importance.reasons).toContain('Test file (lower priority)');
    });

    it('should reduce score for generated files', () => {
      const generatedContent =
        '// This file was automatically generated\nexport const config = {};';
      const result = classifier.classifyFile('generated/config.ts', generatedContent);

      expect(result.characteristics.isGenerated).toBe(true);
      expect(result.importance.reasons).toContain('Generated file (lower priority)');
    });

    it('should detect complex logic', () => {
      const complexContent = `
        class UserService {
          constructor() {}
          
          async createUser(data) {
            if (data.email) {
              for (let i = 0; i < data.roles.length; i++) {
                try {
                  await this.validateRole(data.roles[i]);
                } catch (error) {
                  throw new Error('Invalid role');
                }
              }
            }
          }
          
          validateRole(role) {}
          updateUser(id, data) {}
          deleteUser(id) {}
        }
      `;

      const result = classifier.classifyFile('src/services/user.ts', complexContent);

      expect(result.characteristics.hasComplexLogic).toBe(true);
      expect(result.importance.reasons).toContain('Contains complex business logic');
    });

    it('should detect external dependencies', () => {
      const contentWithDeps = `
        import express from 'express';
        import { Database } from 'pg';
        const redis = require('redis');
      `;

      const result = classifier.classifyFile('src/app.ts', contentWithDeps);

      expect(result.characteristics.hasExternalDependencies).toBe(true);
      expect(result.importance.reasons).toContain('Has external dependencies');
    });

    it('should detect public interfaces', () => {
      const publicContent = `
        export class PublicAPI {
          public async getData() {}
          public async updateData() {}
        }
        
        export interface UserInterface {
          id: string;
          name: string;
        }
      `;

      const result = classifier.classifyFile('src/api/public.ts', publicContent);

      expect(result.characteristics.isPublicInterface).toBe(true);
      expect(result.importance.reasons).toContain('Public API interface');
    });
  });

  describe('architectural role detection', () => {
    it('should identify core business logic', () => {
      const result = classifier.classifyFile(
        'src/business/orders.ts',
        'export class OrderService {}'
      );

      expect(result.characteristics.architecturalRole).toBe('core-business-logic');
    });

    it('should identify data access layer', () => {
      const result = classifier.classifyFile('src/models/user.ts', 'export class UserModel {}');

      expect(result.characteristics.architecturalRole).toBe('data-access');
    });

    it('should identify API interfaces', () => {
      const result = classifier.classifyFile('src/api/routes.ts', 'export const userRoutes = {};');

      expect(result.characteristics.architecturalRole).toBe('api-interface');
    });

    it('should identify security components', () => {
      const result = classifier.classifyFile(
        'src/auth/middleware.ts',
        'export const authenticate = {};'
      );

      expect(result.characteristics.architecturalRole).toBe('security');
    });

    it('should identify utilities', () => {
      const result = classifier.classifyFile(
        'src/utils/helpers.ts',
        'export function formatDate() {}'
      );

      expect(result.characteristics.architecturalRole).toBe('utility');
    });

    it('should identify monitoring components', () => {
      const result = classifier.classifyFile(
        'src/monitoring/logger.ts',
        'export const logger = {};'
      );

      expect(result.characteristics.architecturalRole).toBe('monitoring');
    });
  });

  describe('project type adjustments', () => {
    it('should boost API interface files for API services', () => {
      const apiClassifier = new FilePriorityClassifier({ projectType: 'api-service' });
      const regularClassifier = new FilePriorityClassifier({ projectType: 'web-app' });

      const apiResult = apiClassifier.classifyFile(
        'src/api/routes.ts',
        'export const routes = {};'
      );
      const regularResult = regularClassifier.classifyFile(
        'src/api/routes.ts',
        'export const routes = {};'
      );

      expect(apiResult.importance.score).toBeGreaterThan(regularResult.importance.score);
    });

    it('should boost public interfaces for libraries', () => {
      const libClassifier = new FilePriorityClassifier({ projectType: 'library' });
      const regularClassifier = new FilePriorityClassifier({ projectType: 'web-app' });

      const libResult = libClassifier.classifyFile('src/index.ts', 'export * from "./lib";');
      const regularResult = regularClassifier.classifyFile(
        'src/index.ts',
        'export * from "./lib";'
      );

      expect(libResult.importance.score).toBeGreaterThan(regularResult.importance.score);
    });

    it('should boost infrastructure files for microservices', () => {
      const microClassifier = new FilePriorityClassifier({ projectType: 'microservice' });
      const regularClassifier = new FilePriorityClassifier({ projectType: 'web-app' });

      const microResult = microClassifier.classifyFile('Dockerfile', 'FROM node:18');
      const regularResult = regularClassifier.classifyFile('Dockerfile', 'FROM node:18');

      expect(microResult.importance.score).toBeGreaterThan(regularResult.importance.score);
    });
  });

  describe('language and framework adjustments', () => {
    it('should boost TypeScript definition files', () => {
      const tsClassifier = new FilePriorityClassifier({ primaryLanguage: 'typescript' });

      const result = tsClassifier.classifyFile('src/types.d.ts', 'declare module "custom";');

      expect(result.importance.score).toBeGreaterThan(50);
    });

    it('should boost Python __init__.py files', () => {
      const pyClassifier = new FilePriorityClassifier({ primaryLanguage: 'python' });

      const result = pyClassifier.classifyFile('src/__init__.py', '# Package init');

      expect(result.importance.score).toBeGreaterThan(50);
    });

    it('should boost Java Application files', () => {
      const javaClassifier = new FilePriorityClassifier({ primaryLanguage: 'java' });

      const result = javaClassifier.classifyFile(
        'src/main/java/Application.java',
        'public class Application {}'
      );

      expect(result.importance.score).toBeGreaterThan(100);
    });

    it('should boost React App components', () => {
      const reactClassifier = new FilePriorityClassifier({ framework: 'react' });

      const result = reactClassifier.classifyFile(
        'src/App.tsx',
        'export default function App() {}'
      );

      expect(result.importance.score).toBeGreaterThan(50);
    });

    it('should boost Express server files', () => {
      const expressClassifier = new FilePriorityClassifier({ framework: 'express' });

      const result = expressClassifier.classifyFile(
        'src/server.js',
        'const express = require("express");'
      );

      expect(result.importance.score).toBeGreaterThan(50);
    });
  });

  describe('custom scoring rules', () => {
    it('should apply custom scoring rules', () => {
      const customRules: PriorityScoringRule[] = [
        {
          pattern: /critical/,
          scoreAdjustment: 50,
          reason: 'Critical file pattern',
        },
        {
          pattern: 'legacy',
          scoreAdjustment: -30,
          reason: 'Legacy file (lower priority)',
        },
      ];

      const customClassifier = new FilePriorityClassifier({ customScoringRules: customRules });

      const criticalResult = customClassifier.classifyFile(
        'src/critical-service.ts',
        'export class Service {}'
      );
      const legacyResult = customClassifier.classifyFile(
        'src/legacy-utils.ts',
        'export function old() {}'
      );
      const normalResult = customClassifier.classifyFile(
        'src/normal-utils.ts',
        'export function normal() {}'
      );

      expect(criticalResult.importance.score).toBeGreaterThan(normalResult.importance.score);
      expect(legacyResult.importance.score).toBeLessThan(normalResult.importance.score);
    });
  });

  describe('content analysis', () => {
    it('should boost score for large files with many functions', () => {
      const largeContent = Array(100)
        .fill(0)
        .map((_, i) => `function func${i}() {}`)
        .join('\n');

      const result = classifier.classifyFile('src/large-service.ts', largeContent);

      expect(result.importance.score).toBeGreaterThan(50);
    });

    it('should boost score for files with many classes', () => {
      const classContent = Array(10)
        .fill(0)
        .map((_, i) => `class Class${i} {}`)
        .join('\n');

      const result = classifier.classifyFile('src/models.ts', classContent);

      expect(result.importance.score).toBeGreaterThan(50);
    });

    it('should boost score for files with many imports', () => {
      const importContent = Array(25)
        .fill(0)
        .map((_, i) => `import lib${i} from 'lib${i}';`)
        .join('\n');

      const result = classifier.classifyFile('src/dependencies.ts', importContent);

      expect(result.importance.score).toBeGreaterThan(50);
    });

    it('should disable content analysis when configured', () => {
      const noContentClassifier = new FilePriorityClassifier({ enableContentAnalysis: false });
      const largeContent = Array(100)
        .fill(0)
        .map((_, i) => `function func${i}() {}`)
        .join('\n');

      const withContentResult = classifier.classifyFile('src/service.ts', largeContent);
      const withoutContentResult = noContentClassifier.classifyFile('src/service.ts', largeContent);

      expect(withContentResult.importance.score).toBeGreaterThan(
        withoutContentResult.importance.score
      );
    });
  });

  describe('recommendations', () => {
    it('should generate analysis recommendations for critical files', () => {
      const result = classifier.classifyFile('package.json', '{"name": "test"}');

      const analysisRecs = result.recommendations.filter(r => r.type === 'analysis');
      expect(analysisRecs.length).toBeGreaterThan(0);
      expect(analysisRecs[0].priority).toBe('high');
    });

    it('should generate generation recommendations for schema files', () => {
      const result = classifier.classifyFile('api/openapi.yaml', 'openapi: 3.0.0');

      const generationRecs = result.recommendations.filter(r => r.type === 'generation');
      expect(generationRecs.length).toBeGreaterThan(0);
      expect(generationRecs[0].priority).toBe('high');
    });

    it('should generate monitoring recommendations for complex files', () => {
      const complexContent = Array(20)
        .fill(0)
        .map(
          (_, i) =>
            `function complex${i}() { if (true) { for (let j = 0; j < 10; j++) { try { } catch (e) { } } } }`
        )
        .join('\n');
      const result = classifier.classifyFile('src/complex.ts', complexContent);

      const monitoringRecs = result.recommendations.filter(r => r.type === 'monitoring');
      expect(monitoringRecs.length).toBeGreaterThan(0);
    });

    it('should generate security recommendations for security files', () => {
      const result = classifier.classifyFile(
        'src/auth/security.ts',
        'export class SecurityService {}'
      );

      const securityRecs = result.recommendations.filter(r => r.type === 'security');
      expect(securityRecs.length).toBeGreaterThan(0);
      expect(securityRecs[0].priority).toBe('high');
    });
  });

  describe('batch operations', () => {
    it('should batch classify multiple files', () => {
      const files = [
        { path: 'package.json', content: '{"name": "test"}' },
        { path: 'src/index.ts', content: 'console.log("hello");' },
        { path: 'src/utils.test.ts', content: 'describe("test", () => {});' },
      ];

      const results = classifier.batchClassify(files);

      expect(results).toHaveLength(3);
      expect(results[0].importance.category).toBe('critical'); // package.json
      expect(results[1].importance.category).toBe('critical'); // index.ts
      expect(results[2].characteristics.isTest).toBe(true); // test file
    });

    it('should get top priority files', () => {
      const files: FileIndexEntry[] = [
        {
          path: 'package.json',
          type: 'package',
          size: 100,
          importance: { score: 150, reasons: ['Package file'], category: 'critical' },
          language: undefined,
          lastModified: new Date(),
        },
        {
          path: 'src/index.ts',
          type: 'source',
          size: 200,
          importance: { score: 120, reasons: ['Entry point'], category: 'critical' },
          language: 'typescript',
          lastModified: new Date(),
        },
        {
          path: 'src/utils.ts',
          type: 'source',
          size: 150,
          importance: { score: 80, reasons: ['Source file'], category: 'important' },
          language: 'typescript',
          lastModified: new Date(),
        },
        {
          path: 'src/test.ts',
          type: 'test',
          size: 100,
          importance: { score: 30, reasons: ['Test file'], category: 'normal' },
          language: 'typescript',
          lastModified: new Date(),
        },
      ];

      const topFiles = classifier.getTopPriorityFiles(files, 2);

      expect(topFiles).toHaveLength(2);
      expect(topFiles[0].path).toBe('package.json');
      expect(topFiles[1].path).toBe('src/index.ts');
    });
  });

  describe('edge cases', () => {
    it('should handle files without content', () => {
      const result = classifier.classifyFile('src/empty.ts');

      expect(result.importance).toBeDefined();
      expect(result.characteristics).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should handle files with very long paths', () => {
      const longPath = 'src/' + 'very/'.repeat(20) + 'deep/file.ts';
      const result = classifier.classifyFile(longPath, 'export const value = 1;');

      expect(result.importance).toBeDefined();
      expect(result.characteristics.architecturalRole).toBe('core-business-logic');
    });

    it('should handle files with special characters', () => {
      const result = classifier.classifyFile('src/special-file@2x.ts', 'export const config = {};');

      expect(result.importance).toBeDefined();
      expect(result.characteristics).toBeDefined();
    });

    it('should clamp scores within valid range', () => {
      const customRules: PriorityScoringRule[] = [
        { pattern: 'boost', scoreAdjustment: 1000, reason: 'Huge boost' },
      ];

      const boostClassifier = new FilePriorityClassifier({ customScoringRules: customRules });
      const result = boostClassifier.classifyFile('boost-file.ts', 'export const value = 1;');

      expect(result.importance.score).toBeLessThanOrEqual(200);
      expect(result.importance.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('different file types', () => {
    const testCases = [
      { path: 'README.md', type: 'documentation', expectedRole: 'documentation' },
      { path: 'webpack.config.js', type: 'config', expectedRole: 'build-system' },
      { path: 'src/models/User.java', type: 'source', expectedRole: 'data-access' },
      { path: 'tests/unit.test.js', type: 'test', expectedRole: 'testing' },
      { path: 'deploy/kubernetes.yaml', type: 'config', expectedRole: 'deployment' },
      { path: 'monitoring/metrics.ts', type: 'source', expectedRole: 'monitoring' },
    ];

    testCases.forEach(({ path, type, expectedRole }) => {
      it(`should correctly classify ${path} as ${expectedRole}`, () => {
        const result = classifier.classifyFile(path, 'sample content', type as any);

        expect(result.characteristics.architecturalRole).toBe(expectedRole);
      });
    });
  });
});
