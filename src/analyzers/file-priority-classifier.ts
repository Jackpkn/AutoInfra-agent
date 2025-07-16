import { FileType, ImportanceScore, ImportanceCategory } from '../types/common';
import { FileIndexEntry } from '../types/codebase';

/**
 * Configuration for file priority classification
 */
export interface PriorityClassifierOptions {
  /**
   * Custom scoring rules for specific file patterns
   */
  customScoringRules?: PriorityScoringRule[];

  /**
   * Project type specific adjustments
   */
  projectType?: ProjectType;

  /**
   * Language specific adjustments
   */
  primaryLanguage?: string;

  /**
   * Framework specific adjustments
   */
  framework?: string;

  /**
   * Enable content-based scoring
   */
  enableContentAnalysis?: boolean;
}

/**
 * Project types that affect file prioritization
 */
export type ProjectType =
  | 'web-app'
  | 'api-service'
  | 'library'
  | 'cli-tool'
  | 'mobile-app'
  | 'desktop-app'
  | 'microservice'
  | 'monorepo';

/**
 * Custom scoring rule for specific file patterns
 */
export interface PriorityScoringRule {
  pattern: string | RegExp;
  scoreAdjustment: number;
  reason: string;
  category?: ImportanceCategory;
}

/**
 * File classification result with detailed analysis
 */
export interface FileClassification {
  importance: ImportanceScore;
  characteristics: FileCharacteristics;
  recommendations: ClassificationRecommendation[];
}

/**
 * Detailed characteristics of a file
 */
export interface FileCharacteristics {
  isEntryPoint: boolean;
  isConfiguration: boolean;
  isPackageDefinition: boolean;
  isSchema: boolean;
  isInfrastructure: boolean;
  isTest: boolean;
  isDocumentation: boolean;
  isGenerated: boolean;
  hasComplexLogic: boolean;
  hasExternalDependencies: boolean;
  isPublicInterface: boolean;
  architecturalRole: ArchitecturalRole;
}

/**
 * Architectural role of a file in the project
 */
export type ArchitecturalRole =
  | 'core-business-logic'
  | 'data-access'
  | 'api-interface'
  | 'configuration'
  | 'infrastructure'
  | 'testing'
  | 'documentation'
  | 'build-system'
  | 'deployment'
  | 'monitoring'
  | 'security'
  | 'utility'
  | 'unknown';

/**
 * Recommendation for how to handle a classified file
 */
export interface ClassificationRecommendation {
  type: 'analysis' | 'generation' | 'monitoring' | 'security';
  priority: 'high' | 'medium' | 'low';
  description: string;
  action: string;
}

/**
 * Advanced file priority classifier that scores files by importance
 */
export class FilePriorityClassifier {
  private options: Required<PriorityClassifierOptions>;

  constructor(options?: PriorityClassifierOptions) {
    this.options = {
      customScoringRules: [],
      projectType: 'web-app',
      primaryLanguage: 'javascript',
      framework: '',
      enableContentAnalysis: true,
      ...options,
    };
  }

  /**
   * Classify a file and determine its importance
   */
  classifyFile(path: string, content?: string, type?: FileType): FileClassification {
    const fileName = path.split('/').pop() || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    // Analyze file characteristics
    const characteristics = this.analyzeFileCharacteristics(path, content, type);

    // Calculate base importance score
    let score = this.calculateBaseScore(path, fileName, fileExtension, characteristics);

    // Apply project type adjustments
    score += this.getProjectTypeAdjustment(characteristics);

    // Apply language/framework adjustments
    score += this.getLanguageFrameworkAdjustment(path, content);

    // Apply custom scoring rules
    score += this.applyCustomScoringRules(path, content);

    // Apply content-based adjustments
    if (this.options.enableContentAnalysis && content) {
      score += this.analyzeContentComplexity(content, fileExtension);
    }

    // Determine category and create reasons
    const { category, reasons } = this.determineCategory(score, characteristics);

    const importance: ImportanceScore = {
      score: Math.max(0, Math.min(200, score)), // Clamp between 0-200
      reasons,
      category,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(characteristics, importance);

    return {
      importance,
      characteristics,
      recommendations,
    };
  }

  /**
   * Analyze detailed characteristics of a file
   */
  private analyzeFileCharacteristics(
    path: string,
    content?: string,
    type?: FileType
  ): FileCharacteristics {
    const fileName = path.split('/').pop() || '';
    const pathLower = path.toLowerCase();

    return {
      isEntryPoint: this.isEntryPoint(fileName, path),
      isConfiguration: this.isConfiguration(fileName, path, type),
      isPackageDefinition: this.isPackageDefinition(fileName),
      isSchema: this.isSchema(fileName, path),
      isInfrastructure: this.isInfrastructure(fileName, path),
      isTest: this.isTest(fileName, path),
      isDocumentation: this.isDocumentation(fileName, path, type),
      isGenerated: this.isGenerated(fileName, path, content),
      hasComplexLogic: this.hasComplexLogic(content),
      hasExternalDependencies: this.hasExternalDependencies(content),
      isPublicInterface: this.isPublicInterface(fileName, path, content),
      architecturalRole: this.determineArchitecturalRole(fileName, path, content, type),
    };
  }

  /**
   * Calculate base importance score
   */
  private calculateBaseScore(
    path: string,
    fileName: string,
    extension: string,
    characteristics: FileCharacteristics
  ): number {
    let score = 0;

    // Critical files
    if (characteristics.isPackageDefinition) score += 100;
    if (characteristics.isEntryPoint) score += 90;

    // Important files
    if (characteristics.isConfiguration) score += 50;
    if (characteristics.isSchema) score += 55;
    if (characteristics.isInfrastructure) score += 50;
    if (characteristics.isPublicInterface) score += 45;

    // Architectural role scoring
    switch (characteristics.architecturalRole) {
      case 'core-business-logic':
        score += 80;
        break;
      case 'api-interface':
        score += 75;
        break;
      case 'data-access':
        score += 65;
        break;
      case 'security':
        score += 70;
        break;
      case 'configuration':
        score += 60;
        break;
      case 'infrastructure':
        score += 55;
        break;
      case 'build-system':
        score += 50;
        break;
      case 'deployment':
        score += 45;
        break;
      case 'monitoring':
        score += 40;
        break;
      case 'utility':
        score += 35;
        break;
      case 'testing':
        score += 25;
        break;
      case 'documentation':
        score += 20;
        break;
      default:
        score += 30;
        break;
    }

    // File type scoring
    const sourceExtensions = ['js', 'ts', 'py', 'java', 'go', 'rs', 'cs', 'php', 'rb'];
    if (sourceExtensions.includes(extension)) score += 30;

    // Reduce score for certain characteristics
    if (characteristics.isTest) score -= 15;
    if (characteristics.isGenerated) score -= 20;
    if (characteristics.isDocumentation && !characteristics.isSchema) score -= 10;

    return score;
  }

  /**
   * Apply project type specific adjustments
   */
  private getProjectTypeAdjustment(characteristics: FileCharacteristics): number {
    let adjustment = 0;

    switch (this.options.projectType) {
      case 'api-service':
        if (characteristics.architecturalRole === 'api-interface') adjustment += 20;
        if (characteristics.isSchema) adjustment += 15;
        break;
      case 'library':
        if (characteristics.isPublicInterface) adjustment += 25;
        if (characteristics.isDocumentation) adjustment += 10;
        break;
      case 'cli-tool':
        if (characteristics.isEntryPoint) adjustment += 15;
        if (characteristics.isConfiguration) adjustment += 10;
        break;
      case 'microservice':
        if (characteristics.isInfrastructure) adjustment += 15;
        if (characteristics.architecturalRole === 'monitoring') adjustment += 10;
        break;
      case 'monorepo':
        if (characteristics.isPackageDefinition) adjustment += 10;
        if (characteristics.architecturalRole === 'build-system') adjustment += 15;
        break;
    }

    return adjustment;
  }

  /**
   * Apply language and framework specific adjustments
   */
  private getLanguageFrameworkAdjustment(path: string, content?: string): number {
    let adjustment = 0;
    const fileName = path.split('/').pop() || '';

    // Language specific adjustments
    switch (this.options.primaryLanguage) {
      case 'typescript':
        if (fileName.endsWith('.d.ts')) adjustment += 15; // Type definitions
        if (fileName === 'tsconfig.json') adjustment += 10;
        break;
      case 'python':
        if (fileName === '__init__.py') adjustment += 15;
        if (fileName === 'setup.py' || fileName === 'pyproject.toml') adjustment += 10;
        break;
      case 'java':
        if (fileName.endsWith('Application.java')) adjustment += 15;
        if (fileName === 'pom.xml' || fileName === 'build.gradle') adjustment += 10;
        break;
      case 'go':
        if (fileName === 'main.go') adjustment += 15;
        if (fileName === 'go.mod') adjustment += 10;
        break;
    }

    // Framework specific adjustments
    if (this.options.framework) {
      switch (this.options.framework.toLowerCase()) {
        case 'react':
          if (fileName.includes('App.') || fileName.includes('index.')) adjustment += 10;
          break;
        case 'express':
          if (fileName.includes('server.') || fileName.includes('app.')) adjustment += 10;
          break;
        case 'spring':
          if (fileName.includes('Application.java')) adjustment += 15;
          if (fileName.includes('application.properties') || fileName.includes('application.yml'))
            adjustment += 10;
          break;
        case 'django':
          if (fileName === 'settings.py' || fileName === 'urls.py') adjustment += 10;
          break;
      }
    }

    return adjustment;
  }

  /**
   * Apply custom scoring rules
   */
  private applyCustomScoringRules(path: string, content?: string): number {
    let adjustment = 0;

    for (const rule of this.options.customScoringRules) {
      let matches = false;

      if (typeof rule.pattern === 'string') {
        matches = path.includes(rule.pattern);
      } else {
        matches = rule.pattern.test(path);
      }

      if (matches) {
        adjustment += rule.scoreAdjustment;
      }
    }

    return adjustment;
  }

  /**
   * Analyze content complexity for scoring
   */
  private analyzeContentComplexity(content: string, extension: string): number {
    let complexity = 0;
    const lines = content.split('\n');
    const lineCount = lines.length;

    // Basic complexity indicators
    if (lineCount > 500) complexity += 15;
    else if (lineCount > 200) complexity += 10;
    else if (lineCount > 100) complexity += 5;

    // Language-specific complexity analysis
    if (['js', 'ts', 'py', 'java', 'go', 'rs', 'cs'].includes(extension)) {
      // Count functions/methods
      const functionMatches = content.match(
        /(function|def|func|fn|public|private|protected)\s+\w+/g
      );
      if (functionMatches && functionMatches.length > 20) complexity += 10;
      else if (functionMatches && functionMatches.length > 10) complexity += 5;

      // Count classes/interfaces
      const classMatches = content.match(/(class|interface|struct|enum)\s+\w+/g);
      if (classMatches && classMatches.length > 5) complexity += 10;
      else if (classMatches && classMatches.length > 2) complexity += 5;

      // Count imports/dependencies
      const importMatches = content.match(/(import|require|from|#include|use)\s+/g);
      if (importMatches && importMatches.length > 20) complexity += 5;
    }

    return Math.min(complexity, 25); // Cap complexity bonus
  }

  /**
   * Determine category and reasons based on score and characteristics
   */
  private determineCategory(
    score: number,
    characteristics: FileCharacteristics
  ): { category: ImportanceCategory; reasons: string[] } {
    const reasons: string[] = [];
    let category: ImportanceCategory;

    // Add reasons based on characteristics
    if (characteristics.isPackageDefinition) reasons.push('Package/dependency definition');
    if (characteristics.isEntryPoint) reasons.push('Application entry point');
    if (characteristics.isConfiguration) reasons.push('Configuration file');
    if (characteristics.isSchema) reasons.push('Schema/API definition');
    if (characteristics.isInfrastructure) reasons.push('Infrastructure configuration');
    if (characteristics.isPublicInterface) reasons.push('Public API interface');
    if (characteristics.hasComplexLogic) reasons.push('Contains complex business logic');
    if (characteristics.hasExternalDependencies) reasons.push('Has external dependencies');

    // Architectural role reasons
    switch (characteristics.architecturalRole) {
      case 'core-business-logic':
        reasons.push('Core business logic');
        break;
      case 'api-interface':
        reasons.push('API interface');
        break;
      case 'data-access':
        reasons.push('Data access layer');
        break;
      case 'security':
        reasons.push('Security component');
        break;
    }

    // Negative reasons
    if (characteristics.isTest) reasons.push('Test file (lower priority)');
    if (characteristics.isGenerated) reasons.push('Generated file (lower priority)');
    if (characteristics.isDocumentation && !characteristics.isSchema)
      reasons.push('Documentation file');

    // Determine category based on score
    if (score >= 100) {
      category = 'critical';
    } else if (score >= 60) {
      category = 'important';
    } else if (score >= 20) {
      category = 'normal';
    } else {
      category = 'ignore';
    }

    return { category, reasons };
  }

  /**
   * Generate recommendations based on classification
   */
  private generateRecommendations(
    characteristics: FileCharacteristics,
    importance: ImportanceScore
  ): ClassificationRecommendation[] {
    const recommendations: ClassificationRecommendation[] = [];

    if (characteristics.isEntryPoint || characteristics.isPackageDefinition) {
      recommendations.push({
        type: 'analysis',
        priority: 'high',
        description: 'Critical file for understanding application structure',
        action: 'Analyze first for tech stack detection',
      });
    }

    if (characteristics.isSchema) {
      recommendations.push({
        type: 'generation',
        priority: 'high',
        description: 'API schema affects infrastructure requirements',
        action: 'Use for API gateway and service mesh configuration',
      });
    }

    if (characteristics.isInfrastructure) {
      recommendations.push({
        type: 'analysis',
        priority: 'medium',
        description: 'Existing infrastructure configuration',
        action: 'Analyze for current deployment patterns',
      });
    }

    if (characteristics.hasComplexLogic) {
      recommendations.push({
        type: 'monitoring',
        priority: 'medium',
        description: 'Complex logic may need monitoring',
        action: 'Consider performance monitoring and logging',
      });
    }

    if (characteristics.architecturalRole === 'security') {
      recommendations.push({
        type: 'security',
        priority: 'high',
        description: 'Security-related component',
        action: 'Apply security best practices in generated configs',
      });
    }

    return recommendations;
  }

  // Helper methods for characteristic detection
  private isEntryPoint(fileName: string, path: string): boolean {
    const entryPoints = [
      'index.js',
      'index.ts',
      'main.js',
      'main.ts',
      'app.js',
      'app.ts',
      'server.js',
      'server.ts',
      'main.py',
      'app.py',
      '__main__.py',
      'Main.java',
      'Program.cs',
      'main.go',
      'lib.rs',
      'main.rs',
    ];
    return entryPoints.includes(fileName) || fileName.endsWith('Application.java');
  }

  private isConfiguration(fileName: string, path: string, type?: FileType): boolean {
    if (type === 'config') return true;
    const configPatterns = [
      /\.config\.(js|ts|json)$/,
      /webpack\.config\./,
      /vite\.config\./,
      /rollup\.config\./,
      /babel\.config\./,
      /jest\.config\./,
      /vitest\.config\./,
      /tsconfig\.json$/,
      /\.eslintrc\./,
      /\.prettierrc/,
      /\.env/,
      /\.yml$/,
      /\.yaml$/,
      /\.toml$/,
      /\.ini$/,
    ];
    return configPatterns.some(pattern => pattern.test(fileName));
  }

  private isPackageDefinition(fileName: string): boolean {
    const packageFiles = [
      'package.json',
      'requirements.txt',
      'pom.xml',
      'build.gradle',
      'Cargo.toml',
      'go.mod',
      'composer.json',
      'Gemfile',
      'setup.py',
      'pyproject.toml',
      'Package.swift',
      'pubspec.yaml',
    ];
    return packageFiles.includes(fileName);
  }

  private isSchema(fileName: string, path: string): boolean {
    return (
      fileName.includes('schema') ||
      fileName.includes('openapi') ||
      fileName.includes('swagger') ||
      path.includes('/schema/') ||
      fileName.endsWith('.graphql') ||
      fileName.endsWith('.proto') ||
      fileName.endsWith('.avsc')
    );
  }

  private isInfrastructure(fileName: string, path: string): boolean {
    return (
      fileName.includes('Dockerfile') ||
      fileName.includes('docker-compose') ||
      fileName === '.dockerignore' ||
      path.includes('docker/') ||
      path.includes('.github/') ||
      fileName.includes('.gitlab-ci') ||
      fileName.includes('jenkins') ||
      fileName.includes('terraform') ||
      fileName.includes('ansible')
    );
  }

  private isTest(fileName: string, path: string): boolean {
    return (
      fileName.includes('.test.') ||
      fileName.includes('.spec.') ||
      path.includes('/test/') ||
      path.includes('/__tests__/') ||
      path.includes('/tests/') ||
      fileName.endsWith('Test.java') ||
      fileName.endsWith('_test.go')
    );
  }

  private isDocumentation(fileName: string, path: string, type?: FileType): boolean {
    if (type === 'documentation') return true;
    return (
      fileName.endsWith('.md') ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.rst') ||
      fileName.endsWith('.adoc') ||
      path.includes('/docs/')
    );
  }

  private isGenerated(fileName: string, path: string, content?: string): boolean {
    // Check for common generated file patterns
    if (
      fileName.includes('.generated.') ||
      fileName.includes('.gen.') ||
      path.includes('/generated/') ||
      path.includes('/.next/') ||
      path.includes('/dist/') ||
      path.includes('/build/')
    ) {
      return true;
    }

    // Check content for generation markers
    if (content) {
      const generatedMarkers = [
        'This file was automatically generated',
        'DO NOT EDIT',
        'Auto-generated',
        '@generated',
        'Code generated by',
      ];
      return generatedMarkers.some(marker => content.includes(marker));
    }

    return false;
  }

  private hasComplexLogic(content?: string): boolean {
    if (!content) return false;

    const complexityIndicators = [
      /class\s+\w+/g,
      /function\s+\w+/g,
      /def\s+\w+/g,
      /if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /try\s*{/g,
    ];

    let totalMatches = 0;
    for (const pattern of complexityIndicators) {
      const matches = content.match(pattern);
      if (matches) totalMatches += matches.length;
    }

    return totalMatches > 10; // Threshold for "complex"
  }

  private hasExternalDependencies(content?: string): boolean {
    if (!content) return false;

    const dependencyPatterns = [
      /import\s+.*from\s+['"][^.]/,
      /require\s*\(\s*['"][^.]/,
      /from\s+\w+\s+import/,
      /#include\s*<\w+>/,
    ];

    return dependencyPatterns.some(pattern => pattern.test(content));
  }

  private isPublicInterface(fileName: string, path: string, content?: string): boolean {
    // Check for common public interface patterns
    if (
      fileName.includes('api') ||
      fileName.includes('interface') ||
      fileName.includes('public') ||
      path.includes('/api/') ||
      path.includes('/public/')
    ) {
      return true;
    }

    // Check content for export patterns
    if (content) {
      const exportPatterns = [
        /export\s+(class|function|interface|type)/,
        /module\.exports/,
        /public\s+(class|interface)/,
        /__all__\s*=/,
      ];
      return exportPatterns.some(pattern => pattern.test(content));
    }

    return false;
  }

  private determineArchitecturalRole(
    fileName: string,
    path: string,
    content?: string,
    type?: FileType
  ): ArchitecturalRole {
    // Infrastructure and deployment
    if (this.isInfrastructure(fileName, path)) return 'infrastructure';
    if (fileName.includes('deploy') || path.includes('/deploy/')) return 'deployment';

    // Configuration and build - check build system first
    if (fileName.includes('build') || fileName.includes('webpack') || fileName.includes('rollup'))
      return 'build-system';
    if (this.isConfiguration(fileName, path, type)) return 'configuration';

    // Testing and documentation
    if (this.isTest(fileName, path)) return 'testing';
    if (this.isDocumentation(fileName, path, type)) return 'documentation';

    // API and interfaces
    if (fileName.includes('api') || path.includes('/api/') || this.isSchema(fileName, path))
      return 'api-interface';

    // Data access
    if (
      fileName.includes('model') ||
      fileName.includes('repository') ||
      fileName.includes('dao') ||
      path.includes('/models/') ||
      path.includes('/data/')
    )
      return 'data-access';

    // Security
    if (fileName.includes('auth') || fileName.includes('security') || fileName.includes('crypto'))
      return 'security';

    // Monitoring and logging
    if (fileName.includes('log') || fileName.includes('monitor') || fileName.includes('metric'))
      return 'monitoring';

    // Utilities
    if (fileName.includes('util') || fileName.includes('helper') || path.includes('/utils/'))
      return 'utility';

    // Core business logic (default for main source files)
    if (type === 'source' && !this.isTest(fileName, path)) return 'core-business-logic';

    return 'unknown';
  }

  /**
   * Batch classify multiple files
   */
  batchClassify(
    files: Array<{ path: string; content?: string; type?: FileType }>
  ): FileClassification[] {
    return files.map(file => this.classifyFile(file.path, file.content, file.type));
  }

  /**
   * Get top priority files from a list
   */
  getTopPriorityFiles(files: FileIndexEntry[], limit: number = 50): FileIndexEntry[] {
    return files
      .filter(
        file => file.importance.category === 'critical' || file.importance.category === 'important'
      )
      .sort((a, b) => b.importance.score - a.importance.score)
      .slice(0, limit);
  }
}
