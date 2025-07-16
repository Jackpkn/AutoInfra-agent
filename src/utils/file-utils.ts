import { FileType, ImportanceScore } from '../types';

/**
 * Interface for file utility functions
 */
export interface FileUtils {
  /**
   * Determines the file type based on path and content
   */
  getFileType(path: string, content?: string): FileType;

  /**
   * Calculates the importance score of a file
   */
  calculateImportanceScore(path: string, content?: string): ImportanceScore;

  /**
   * Checks if a file should be ignored during analysis
   */
  shouldIgnoreFile(path: string): boolean;

  /**
   * Extracts the programming language from file extension
   */
  getLanguageFromPath(path: string): string | undefined;

  /**
   * Normalizes file paths for consistent processing
   */
  normalizePath(path: string): string;
}

/**
 * Default implementation of FileUtils
 */
export class DefaultFileUtils implements FileUtils {
  private readonly packageFilePatterns = [
    'package.json',
    'requirements.txt',
    'pom.xml',
    'build.gradle',
    'Cargo.toml',
    'go.mod',
    'composer.json',
    'Gemfile',
  ];

  private readonly configFilePatterns = [
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
    /docker-compose\./,
    /Dockerfile/,
    /\.env/,
    /\.yml$/,
    /\.yaml$/,
  ];

  private readonly entryPointPatterns = [
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
  ];

  getFileType(path: string, content?: string): FileType {
    const fileName = path.split('/').pop() || '';

    if (this.packageFilePatterns.includes(fileName)) {
      return 'package';
    }

    if (
      this.configFilePatterns.some(pattern =>
        typeof pattern === 'string' ? fileName === pattern : pattern.test(fileName)
      )
    ) {
      return 'config';
    }

    if (this.entryPointPatterns.includes(fileName)) {
      return 'source';
    }

    if (
      fileName.includes('.test.') ||
      fileName.includes('.spec.') ||
      path.includes('/test/') ||
      path.includes('/__tests__/')
    ) {
      return 'test';
    }

    if (fileName.endsWith('.md') || fileName.endsWith('.txt') || fileName.endsWith('.rst')) {
      return 'documentation';
    }

    if (fileName.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      return 'asset';
    }

    if (fileName.match(/\.(js|ts|py|java|go|rs|cs|php|rb|cpp|c|h)$/)) {
      return 'source';
    }

    if (fileName.match(/\.(json|xml|yml|yaml|toml|ini)$/)) {
      return 'config';
    }

    return 'source';
  }

  calculateImportanceScore(path: string, content?: string): ImportanceScore {
    const fileName = path.split('/').pop() || '';
    let score = 0;
    const reasons: string[] = [];

    // Package files are critical
    if (this.packageFilePatterns.includes(fileName)) {
      score += 100;
      reasons.push('Package/dependency file');
    }

    // Entry points are very important
    if (this.entryPointPatterns.includes(fileName)) {
      score += 80;
      reasons.push('Application entry point');
    }

    // Configuration files are important
    if (
      this.configFilePatterns.some(pattern =>
        typeof pattern === 'string' ? fileName === pattern : pattern.test(fileName)
      )
    ) {
      score += 60;
      reasons.push('Configuration file');
    }

    // Docker and CI/CD files
    if (
      fileName.includes('Dockerfile') ||
      fileName.includes('docker-compose') ||
      fileName.includes('.github') ||
      fileName.includes('.gitlab-ci')
    ) {
      score += 70;
      reasons.push('Infrastructure configuration');
    }

    // Schema files
    if (
      fileName.includes('schema') ||
      fileName.includes('openapi') ||
      fileName.includes('swagger')
    ) {
      score += 50;
      reasons.push('API schema definition');
    }

    // Source files get base score
    if (this.getFileType(path) === 'source') {
      score += 30;
      reasons.push('Source code file');
    }

    // Reduce score for test files
    if (this.getFileType(path) === 'test') {
      score = Math.max(score - 20, 10);
      reasons.push('Test file (lower priority)');
    }

    // Determine category
    let category: ImportanceScore['category'];
    if (score >= 80) {
      category = 'critical';
    } else if (score >= 50) {
      category = 'important';
    } else if (score >= 20) {
      category = 'normal';
    } else {
      category = 'ignore';
    }

    return { score, reasons, category };
  }

  shouldIgnoreFile(path: string): boolean {
    const ignorePaths = [
      'node_modules/',
      '.git/',
      'dist/',
      'build/',
      'target/',
      '.next/',
      '.nuxt/',
      'coverage/',
      '.nyc_output/',
      '__pycache__/',
      '*.pyc',
      '.DS_Store',
      'Thumbs.db',
    ];

    return ignorePaths.some(pattern => {
      if (pattern.endsWith('/')) {
        return path.includes(pattern);
      }
      if (pattern.startsWith('*')) {
        return path.endsWith(pattern.slice(1));
      }
      return path.includes(pattern);
    });
  }

  getLanguageFromPath(path: string): string | undefined {
    const extension = path.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      cpp: 'cpp',
      c: 'c',
      h: 'c',
      hpp: 'cpp',
      kt: 'kotlin',
      scala: 'scala',
      clj: 'clojure',
      hs: 'haskell',
      elm: 'elm',
      dart: 'dart',
      swift: 'swift',
    };

    return extension ? languageMap[extension] : undefined;
  }

  normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
  }
}
