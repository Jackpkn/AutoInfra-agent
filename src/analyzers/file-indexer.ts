import {
  CodebaseInput,
  CodebaseIndex,
  FileIndexEntry,
  PriorityFileMap,
  CodebaseStatistics,
  DependencyGraph,
  AST,
} from '../types/codebase';
import { FileType } from '../types/common';
import { DefaultFileUtils, FileUtils } from '../utils/file-utils';
import { ErrorFactory, ErrorCodes } from '../utils/error-handler';

/**
 * Configuration options for file indexing
 */
export interface FileIndexerOptions {
  /**
   * Maximum number of files to process
   */
  maxFiles?: number;

  /**
   * Maximum file size to process (in bytes)
   */
  maxFileSize?: number;

  /**
   * Custom ignore patterns (in addition to default ones)
   */
  customIgnorePatterns?: string[];

  /**
   * Whether to include file content in the index
   */
  includeContent?: boolean;

  /**
   * Whether to calculate file hashes for change detection
   */
  calculateHashes?: boolean;

  /**
   * Custom file type detection rules
   */
  customFileTypeRules?: Record<string, FileType>;
}

/**
 * File indexing result with statistics
 */
export interface IndexingResult {
  index: CodebaseIndex;
  statistics: {
    totalFilesScanned: number;
    filesIndexed: number;
    filesIgnored: number;
    totalSizeBytes: number;
    processingTimeMs: number;
    errors: string[];
    warnings: string[];
  };
}

/**
 * File system indexer that efficiently scans directory structures
 */
export class FileIndexer {
  private fileUtils: FileUtils;
  private options: Required<FileIndexerOptions>;

  constructor(fileUtils?: FileUtils, options?: FileIndexerOptions) {
    this.fileUtils = fileUtils || new DefaultFileUtils();
    this.options = {
      maxFiles: 10000,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      customIgnorePatterns: [],
      includeContent: false,
      calculateHashes: false,
      customFileTypeRules: {},
      ...options,
    };
  }

  /**
   * Index a codebase from file entries
   */
  async indexCodebase(codebaseInput: CodebaseInput): Promise<IndexingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate input
      if (!codebaseInput.files || codebaseInput.files.length === 0) {
        throw ErrorFactory.createAnalysisError(
          ErrorCodes.FILE_INDEXING_FAILED,
          'No files provided for indexing'
        );
      }

      // Filter and process files
      const filteredFiles = this.filterFiles(codebaseInput.files);

      if (filteredFiles.length === 0) {
        warnings.push('No files remaining after filtering');
      }

      // Create file index entries
      const fileIndex: FileIndexEntry[] = [];
      let totalSize = 0;
      let filesIgnored = 0;

      for (const file of filteredFiles) {
        try {
          if (this.shouldIgnoreFile(file.path)) {
            filesIgnored++;
            continue;
          }

          if (file.size > this.options.maxFileSize) {
            warnings.push(`File ${file.path} exceeds maximum size limit (${file.size} bytes)`);
            filesIgnored++;
            continue;
          }

          const indexEntry = this.createFileIndexEntry(file);
          fileIndex.push(indexEntry);
          totalSize += file.size;

          if (fileIndex.length >= this.options.maxFiles) {
            warnings.push(
              `Reached maximum file limit (${this.options.maxFiles}), stopping indexing`
            );
            break;
          }
        } catch (error) {
          errors.push(
            `Error processing file ${file.path}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      // Sort by importance score (descending)
      fileIndex.sort((a, b) => b.importance.score - a.importance.score);

      // Create priority file map
      const priorityFiles = this.createPriorityFileMap(fileIndex);

      // Calculate statistics
      const statistics = this.calculateStatistics(fileIndex);

      // Create codebase index
      const index: CodebaseIndex = {
        fileIndex,
        priorityFiles,
        astCache: new Map<string, AST>(),
        dependencyGraph: this.createEmptyDependencyGraph(),
        statistics,
      };

      const processingTime = Date.now() - startTime;

      return {
        index,
        statistics: {
          totalFilesScanned: codebaseInput.files.length,
          filesIndexed: fileIndex.length,
          filesIgnored,
          totalSizeBytes: totalSize,
          processingTimeMs: processingTime,
          errors,
          warnings,
        },
      };
    } catch (error) {
      throw ErrorFactory.createAnalysisError(
        ErrorCodes.FILE_INDEXING_FAILED,
        `File indexing failed: ${error instanceof Error ? error.message : String(error)}`,
        false,
        ['Check file permissions', 'Verify file structure', 'Reduce file count or size'],
        {
          processedFiles: 0,
          totalFiles: codebaseInput.files.length,
          processingTimeMs: Date.now() - startTime,
        }
      );
    }
  }

  /**
   * Filter files based on basic criteria
   */
  private filterFiles(
    files: Array<{ path: string; content: string; size: number; type?: FileType }>
  ): Array<{ path: string; content: string; size: number; type?: FileType }> {
    return files.filter(file => {
      // Basic validation
      if (!file.path || typeof file.path !== 'string') {
        return false;
      }

      if (file.size < 0) {
        return false;
      }

      // Normalize path
      file.path = this.fileUtils.normalizePath(file.path);

      return true;
    });
  }

  /**
   * Check if a file should be ignored
   */
  private shouldIgnoreFile(path: string): boolean {
    // Use default ignore rules
    if (this.fileUtils.shouldIgnoreFile(path)) {
      return true;
    }

    // Check custom ignore patterns
    return this.options.customIgnorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        // Simple glob pattern matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(path);
      }
      return path.includes(pattern);
    });
  }

  /**
   * Create a file index entry from a file
   */
  private createFileIndexEntry(file: {
    path: string;
    content: string;
    size: number;
    type?: FileType;
  }): FileIndexEntry {
    const normalizedPath = this.fileUtils.normalizePath(file.path);

    // Determine file type - check custom rules first
    let fileType = file.type;
    if (this.options.customFileTypeRules[normalizedPath]) {
      fileType = this.options.customFileTypeRules[normalizedPath];
    } else if (!fileType) {
      fileType = this.fileUtils.getFileType(normalizedPath, file.content);
    }

    // Calculate importance score
    const importance = this.fileUtils.calculateImportanceScore(normalizedPath, file.content);

    // Detect language
    const language = this.fileUtils.getLanguageFromPath(normalizedPath);

    return {
      path: normalizedPath,
      type: fileType,
      size: file.size,
      importance,
      language,
      lastModified: new Date(), // In a real scenario, this would come from file system
    };
  }

  /**
   * Create priority file map from indexed files
   */
  private createPriorityFileMap(fileIndex: FileIndexEntry[]): PriorityFileMap {
    const priorityFiles: PriorityFileMap = {
      packageFiles: [],
      configFiles: [],
      entryPoints: [],
      schemas: [],
      dockerFiles: [],
      cicdFiles: [],
    };

    for (const file of fileIndex) {
      const fileName = file.path.split('/').pop() || '';
      const path = file.path.toLowerCase();

      // Package files
      if (file.type === 'package' || this.isPackageFile(fileName)) {
        priorityFiles.packageFiles.push(file.path);
      }

      // Configuration files
      if (file.type === 'config' || this.isConfigFile(fileName)) {
        priorityFiles.configFiles.push(file.path);
      }

      // Entry points
      if (this.isEntryPoint(fileName)) {
        priorityFiles.entryPoints.push(file.path);
      }

      // Schema files
      if (this.isSchemaFile(fileName, path)) {
        priorityFiles.schemas.push(file.path);
      }

      // Docker files
      if (this.isDockerFile(fileName, path)) {
        priorityFiles.dockerFiles.push(file.path);
      }

      // CI/CD files
      if (this.isCICDFile(fileName, path)) {
        priorityFiles.cicdFiles.push(file.path);
      }
    }

    return priorityFiles;
  }

  /**
   * Calculate codebase statistics
   */
  private calculateStatistics(fileIndex: FileIndexEntry[]): CodebaseStatistics {
    const languageDistribution: Record<string, number> = {};
    const fileTypeDistribution: Record<FileType, number> = {
      package: 0,
      config: 0,
      source: 0,
      test: 0,
      documentation: 0,
      asset: 0,
      build: 0,
      schema: 0,
    };
    let totalSize = 0;
    let complexityScore = 0;

    for (const file of fileIndex) {
      // Language distribution
      if (file.language) {
        languageDistribution[file.language] = (languageDistribution[file.language] || 0) + 1;
      }

      // File type distribution
      fileTypeDistribution[file.type] = (fileTypeDistribution[file.type] || 0) + 1;

      // Total size
      totalSize += file.size;

      // Complexity score (based on importance and file count)
      complexityScore += file.importance.score * 0.1;
    }

    return {
      totalFiles: fileIndex.length,
      totalSize,
      languageDistribution,
      fileTypeDistribution,
      complexityScore: Math.round(complexityScore),
    };
  }

  /**
   * Create empty dependency graph
   */
  private createEmptyDependencyGraph(): DependencyGraph {
    return {
      nodes: [],
      edges: [],
    };
  }

  // Helper methods for file classification
  private isPackageFile(fileName: string): boolean {
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

  private isConfigFile(fileName: string): boolean {
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

  private isEntryPoint(fileName: string): boolean {
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
    return entryPoints.includes(fileName);
  }

  private isSchemaFile(fileName: string, path: string): boolean {
    return (
      fileName.includes('schema') ||
      fileName.includes('openapi') ||
      fileName.includes('swagger') ||
      path.includes('/schema/') ||
      fileName.endsWith('.graphql') ||
      fileName.endsWith('.proto')
    );
  }

  private isDockerFile(fileName: string, path: string): boolean {
    return (
      fileName.includes('Dockerfile') ||
      fileName.includes('docker-compose') ||
      fileName === '.dockerignore' ||
      path.includes('docker/')
    );
  }

  private isCICDFile(fileName: string, path: string): boolean {
    return (
      path.includes('.github/') ||
      fileName.includes('.gitlab-ci') ||
      fileName.includes('jenkins') ||
      fileName.includes('Jenkinsfile') ||
      fileName.includes('azure-pipelines') ||
      fileName.includes('buildspec') ||
      fileName.includes('cloudbuild')
    );
  }

  /**
   * Get top priority files for analysis
   */
  getTopPriorityFiles(index: CodebaseIndex, limit: number = 50): FileIndexEntry[] {
    return index.fileIndex
      .filter(
        file => file.importance.category === 'critical' || file.importance.category === 'important'
      )
      .slice(0, limit);
  }

  /**
   * Get files by type
   */
  getFilesByType(index: CodebaseIndex, type: FileType): FileIndexEntry[] {
    return index.fileIndex.filter(file => file.type === type);
  }

  /**
   * Get files by language
   */
  getFilesByLanguage(index: CodebaseIndex, language: string): FileIndexEntry[] {
    return index.fileIndex.filter(file => file.language === language);
  }

  /**
   * Search files by pattern
   */
  searchFiles(index: CodebaseIndex, pattern: string | RegExp): FileIndexEntry[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    return index.fileIndex.filter(file => regex.test(file.path));
  }
}
