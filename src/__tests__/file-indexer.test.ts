import { describe, it, expect, beforeEach } from 'vitest';
import { FileIndexer, FileIndexerOptions } from '../analyzers/file-indexer';
import { CodebaseInput, FileEntry } from '../types/codebase';
import { DefaultFileUtils } from '../utils/file-utils';

describe('FileIndexer', () => {
  let fileIndexer: FileIndexer;
  let mockCodebaseInput: CodebaseInput;

  beforeEach(() => {
    fileIndexer = new FileIndexer();

    mockCodebaseInput = {
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
        {
          path: 'src/utils/helper.ts',
          content: 'export function helper() { return true; }',
          size: 75,
          type: 'source',
        },
        {
          path: 'README.md',
          content: '# Test Project\nThis is a test project.',
          size: 40,
          type: 'documentation',
        },
        {
          path: 'Dockerfile',
          content: 'FROM node:18\nCOPY . .\nRUN npm install',
          size: 60,
          type: 'config',
        },
        {
          path: '.github/workflows/ci.yml',
          content: 'name: CI\non: [push]',
          size: 30,
          type: 'config',
        },
        {
          path: 'node_modules/some-package/index.js',
          content: 'module.exports = {};',
          size: 25,
          type: 'source',
        },
        {
          path: 'src/components/Button.test.ts',
          content: 'describe("Button", () => {});',
          size: 35,
          type: 'test',
        },
      ],
      metadata: {
        name: 'test-project',
        description: 'A test project for file indexing',
      },
    };
  });

  describe('indexCodebase', () => {
    it('should successfully index a valid codebase', async () => {
      const result = await fileIndexer.indexCodebase(mockCodebaseInput);

      expect(result.index).toBeDefined();
      expect(result.index.fileIndex).toBeInstanceOf(Array);
      expect(result.index.priorityFiles).toBeDefined();
      expect(result.index.statistics).toBeDefined();
      expect(result.statistics.totalFilesScanned).toBe(8);
      expect(result.statistics.filesIndexed).toBeGreaterThan(0);
      expect(result.statistics.processingTimeMs).toBeGreaterThan(0);
    });

    it('should ignore node_modules files by default', async () => {
      const result = await fileIndexer.indexCodebase(mockCodebaseInput);

      const nodeModulesFiles = result.index.fileIndex.filter(file =>
        file.path.includes('node_modules')
      );
      expect(nodeModulesFiles).toHaveLength(0);
      expect(result.statistics.filesIgnored).toBeGreaterThan(0);
    });

    it('should sort files by importance score', async () => {
      const result = await fileIndexer.indexCodebase(mockCodebaseInput);

      const scores = result.index.fileIndex.map(file => file.importance.score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });

    it('should create priority file map correctly', async () => {
      const result = await fileIndexer.indexCodebase(mockCodebaseInput);

      expect(result.index.priorityFiles.packageFiles).toContain('package.json');
      expect(result.index.priorityFiles.entryPoints).toContain('src/index.ts');
      expect(result.index.priorityFiles.dockerFiles).toContain('Dockerfile');
      expect(result.index.priorityFiles.cicdFiles).toContain('.github/workflows/ci.yml');
    });

    it('should calculate statistics correctly', async () => {
      const result = await fileIndexer.indexCodebase(mockCodebaseInput);

      expect(result.index.statistics.totalFiles).toBeGreaterThan(0);
      expect(result.index.statistics.totalSize).toBeGreaterThan(0);
      expect(result.index.statistics.languageDistribution).toBeDefined();
      expect(result.index.statistics.fileTypeDistribution).toBeDefined();
      expect(result.index.statistics.complexityScore).toBeGreaterThan(0);
    });

    it('should handle empty file list', async () => {
      const emptyInput: CodebaseInput = {
        files: [],
        metadata: { name: 'empty-project' },
      };

      await expect(fileIndexer.indexCodebase(emptyInput)).rejects.toThrow(
        'No files provided for indexing'
      );
    });

    it('should handle files with invalid paths', async () => {
      const invalidInput: CodebaseInput = {
        files: [
          {
            path: '',
            content: 'test',
            size: 10,
            type: 'source',
          },
          {
            path: 'valid.js',
            content: 'console.log("valid");',
            size: 20,
            type: 'source',
          },
        ],
        metadata: { name: 'test-project' },
      };

      const result = await fileIndexer.indexCodebase(invalidInput);
      expect(result.index.fileIndex).toHaveLength(1);
      expect(result.index.fileIndex[0].path).toBe('valid.js');
    });

    it('should respect maxFiles option', async () => {
      // Create input with more files than the limit
      const manyFilesInput: CodebaseInput = {
        files: [
          { path: 'file1.js', content: 'console.log(1);', size: 20, type: 'source' },
          { path: 'file2.js', content: 'console.log(2);', size: 20, type: 'source' },
          { path: 'file3.js', content: 'console.log(3);', size: 20, type: 'source' },
          { path: 'file4.js', content: 'console.log(4);', size: 20, type: 'source' },
          { path: 'file5.js', content: 'console.log(5);', size: 20, type: 'source' },
        ],
        metadata: { name: 'many-files-project' },
      };

      const options: FileIndexerOptions = {
        maxFiles: 3,
      };
      const indexer = new FileIndexer(undefined, options);

      const result = await indexer.indexCodebase(manyFilesInput);
      expect(result.index.fileIndex.length).toBeLessThanOrEqual(3);
      expect(result.statistics.warnings).toContain(
        expect.stringContaining('Reached maximum file limit')
      );
    });

    it('should respect maxFileSize option', async () => {
      const largeFileInput: CodebaseInput = {
        files: [
          {
            path: 'large-file.js',
            content: 'x'.repeat(1000),
            size: 1000,
            type: 'source',
          },
          {
            path: 'small-file.js',
            content: 'console.log("small");',
            size: 20,
            type: 'source',
          },
        ],
        metadata: { name: 'test-project' },
      };

      const options: FileIndexerOptions = {
        maxFileSize: 500,
      };
      const indexer = new FileIndexer(undefined, options);

      const result = await indexer.indexCodebase(largeFileInput);
      expect(result.index.fileIndex).toHaveLength(1);
      expect(result.index.fileIndex[0].path).toBe('small-file.js');
      expect(result.statistics.warnings).toContain(
        expect.stringContaining('exceeds maximum size limit')
      );
    });

    it('should use custom ignore patterns', async () => {
      const options: FileIndexerOptions = {
        customIgnorePatterns: ['src/utils/*'],
      };
      const indexer = new FileIndexer(undefined, options);

      const result = await indexer.indexCodebase(mockCodebaseInput);
      const utilsFiles = result.index.fileIndex.filter(file => file.path.includes('src/utils/'));
      expect(utilsFiles).toHaveLength(0);
    });

    it('should use custom file type rules', async () => {
      const options: FileIndexerOptions = {
        customFileTypeRules: {
          'README.md': 'config', // Override default documentation type
        },
      };
      const indexer = new FileIndexer(undefined, options);

      const result = await indexer.indexCodebase(mockCodebaseInput);
      const readmeFile = result.index.fileIndex.find(file => file.path === 'README.md');
      expect(readmeFile?.type).toBe('config');
    });

    it('should handle processing errors gracefully', async () => {
      const corruptedInput: CodebaseInput = {
        files: [
          {
            path: 'valid.js',
            content: 'console.log("valid");',
            size: 20,
            type: 'source',
          },
          {
            path: 'corrupted.js',
            content: 'console.log("corrupted");',
            size: -1, // Invalid size
            type: 'source',
          },
        ],
        metadata: { name: 'test-project' },
      };

      const result = await fileIndexer.indexCodebase(corruptedInput);
      expect(result.index.fileIndex).toHaveLength(1);
      expect(result.index.fileIndex[0].path).toBe('valid.js');
    });
  });

  describe('utility methods', () => {
    let indexResult: any;

    beforeEach(async () => {
      indexResult = await fileIndexer.indexCodebase(mockCodebaseInput);
    });

    it('should get top priority files', () => {
      const topFiles = fileIndexer.getTopPriorityFiles(indexResult.index, 3);

      expect(topFiles.length).toBeLessThanOrEqual(3);
      topFiles.forEach(file => {
        expect(['critical', 'important']).toContain(file.importance.category);
      });
    });

    it('should get files by type', () => {
      const sourceFiles = fileIndexer.getFilesByType(indexResult.index, 'source');

      sourceFiles.forEach(file => {
        expect(file.type).toBe('source');
      });
    });

    it('should get files by language', () => {
      const tsFiles = fileIndexer.getFilesByLanguage(indexResult.index, 'typescript');

      tsFiles.forEach(file => {
        expect(file.language).toBe('typescript');
      });
    });

    it('should search files by string pattern', () => {
      const srcFiles = fileIndexer.searchFiles(indexResult.index, 'src/');

      srcFiles.forEach(file => {
        expect(file.path).toContain('src/');
      });
    });

    it('should search files by regex pattern', () => {
      const testFiles = fileIndexer.searchFiles(indexResult.index, /\.test\./);

      testFiles.forEach(file => {
        expect(file.path).toMatch(/\.test\./);
      });
    });
  });

  describe('file classification', () => {
    it('should correctly identify package files', async () => {
      const packageInput: CodebaseInput = {
        files: [
          { path: 'package.json', content: '{}', size: 10, type: 'package' },
          { path: 'requirements.txt', content: 'flask==2.0.0', size: 15, type: 'package' },
          { path: 'pom.xml', content: '<project></project>', size: 25, type: 'package' },
          { path: 'Cargo.toml', content: '[package]', size: 12, type: 'package' },
        ],
        metadata: { name: 'multi-lang-project' },
      };

      const result = await fileIndexer.indexCodebase(packageInput);
      expect(result.index.priorityFiles.packageFiles).toHaveLength(4);
      expect(result.index.priorityFiles.packageFiles).toContain('package.json');
      expect(result.index.priorityFiles.packageFiles).toContain('requirements.txt');
      expect(result.index.priorityFiles.packageFiles).toContain('pom.xml');
      expect(result.index.priorityFiles.packageFiles).toContain('Cargo.toml');
    });

    it('should correctly identify entry points', async () => {
      const entryPointInput: CodebaseInput = {
        files: [
          { path: 'index.js', content: 'console.log("entry");', size: 20, type: 'source' },
          { path: 'main.py', content: 'print("main")', size: 15, type: 'source' },
          { path: 'Main.java', content: 'public class Main {}', size: 25, type: 'source' },
          { path: 'src/app.ts', content: 'export default app;', size: 18, type: 'source' },
        ],
        metadata: { name: 'entry-points-project' },
      };

      const result = await fileIndexer.indexCodebase(entryPointInput);
      expect(result.index.priorityFiles.entryPoints).toContain('index.js');
      expect(result.index.priorityFiles.entryPoints).toContain('main.py');
      expect(result.index.priorityFiles.entryPoints).toContain('Main.java');
      expect(result.index.priorityFiles.entryPoints).toContain('src/app.ts');
    });

    it('should correctly identify schema files', async () => {
      const schemaInput: CodebaseInput = {
        files: [
          { path: 'schema.json', content: '{"type": "object"}', size: 20, type: 'schema' },
          { path: 'openapi.yaml', content: 'openapi: 3.0.0', size: 15, type: 'schema' },
          { path: 'user.graphql', content: 'type User { id: ID! }', size: 25, type: 'schema' },
          { path: 'message.proto', content: 'syntax = "proto3";', size: 18, type: 'schema' },
        ],
        metadata: { name: 'schema-project' },
      };

      const result = await fileIndexer.indexCodebase(schemaInput);
      expect(result.index.priorityFiles.schemas).toContain('schema.json');
      expect(result.index.priorityFiles.schemas).toContain('openapi.yaml');
      expect(result.index.priorityFiles.schemas).toContain('user.graphql');
      expect(result.index.priorityFiles.schemas).toContain('message.proto');
    });

    it('should correctly identify Docker files', async () => {
      const dockerInput: CodebaseInput = {
        files: [
          { path: 'Dockerfile', content: 'FROM node:18', size: 15, type: 'config' },
          { path: 'docker-compose.yml', content: 'version: "3"', size: 20, type: 'config' },
          { path: '.dockerignore', content: 'node_modules', size: 12, type: 'config' },
          { path: 'docker/app.dockerfile', content: 'FROM alpine', size: 15, type: 'config' },
        ],
        metadata: { name: 'docker-project' },
      };

      const result = await fileIndexer.indexCodebase(dockerInput);
      expect(result.index.priorityFiles.dockerFiles).toContain('Dockerfile');
      expect(result.index.priorityFiles.dockerFiles).toContain('docker-compose.yml');
      expect(result.index.priorityFiles.dockerFiles).toContain('.dockerignore');
      expect(result.index.priorityFiles.dockerFiles).toContain('docker/app.dockerfile');
    });

    it('should correctly identify CI/CD files', async () => {
      const cicdInput: CodebaseInput = {
        files: [
          { path: '.github/workflows/ci.yml', content: 'name: CI', size: 15, type: 'config' },
          { path: '.gitlab-ci.yml', content: 'stages: [build]', size: 20, type: 'config' },
          { path: 'jenkins/Jenkinsfile', content: 'pipeline {}', size: 15, type: 'config' },
          { path: 'buildspec.yml', content: 'version: 0.2', size: 12, type: 'config' },
        ],
        metadata: { name: 'cicd-project' },
      };

      const result = await fileIndexer.indexCodebase(cicdInput);
      expect(result.index.priorityFiles.cicdFiles).toContain('.github/workflows/ci.yml');
      expect(result.index.priorityFiles.cicdFiles).toContain('.gitlab-ci.yml');
      expect(result.index.priorityFiles.cicdFiles).toContain('jenkins/Jenkinsfile');
      expect(result.index.priorityFiles.cicdFiles).toContain('buildspec.yml');
    });
  });

  describe('language detection', () => {
    it('should detect multiple programming languages', async () => {
      const multiLangInput: CodebaseInput = {
        files: [
          { path: 'app.js', content: 'console.log("js");', size: 20, type: 'source' },
          { path: 'app.ts', content: 'console.log("ts");', size: 20, type: 'source' },
          { path: 'app.py', content: 'print("python")', size: 15, type: 'source' },
          { path: 'App.java', content: 'public class App {}', size: 25, type: 'source' },
          { path: 'main.go', content: 'package main', size: 12, type: 'source' },
          { path: 'lib.rs', content: 'fn main() {}', size: 12, type: 'source' },
        ],
        metadata: { name: 'multi-lang-project' },
      };

      const result = await fileIndexer.indexCodebase(multiLangInput);
      const languages = Object.keys(result.index.statistics.languageDistribution);

      expect(languages).toContain('javascript');
      expect(languages).toContain('typescript');
      expect(languages).toContain('python');
      expect(languages).toContain('java');
      expect(languages).toContain('go');
      expect(languages).toContain('rust');
    });

    it('should calculate language distribution correctly', async () => {
      const jsHeavyInput: CodebaseInput = {
        files: [
          { path: 'app.js', content: 'console.log("js1");', size: 20, type: 'source' },
          { path: 'utils.js', content: 'console.log("js2");', size: 20, type: 'source' },
          { path: 'helper.js', content: 'console.log("js3");', size: 20, type: 'source' },
          { path: 'app.py', content: 'print("python")', size: 15, type: 'source' },
        ],
        metadata: { name: 'js-heavy-project' },
      };

      const result = await fileIndexer.indexCodebase(jsHeavyInput);
      expect(result.index.statistics.languageDistribution.javascript).toBe(3);
      expect(result.index.statistics.languageDistribution.python).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle file processing errors without stopping', async () => {
      // Mock FileUtils to throw error for specific file
      const mockFileUtils = new DefaultFileUtils();
      const originalGetFileType = mockFileUtils.getFileType;
      mockFileUtils.getFileType = (path: string) => {
        if (path === 'error-file.js') {
          throw new Error('Simulated processing error');
        }
        return originalGetFileType.call(mockFileUtils, path);
      };

      const indexer = new FileIndexer(mockFileUtils);
      const result = await indexer.indexCodebase(mockCodebaseInput);

      expect(result.statistics.errors.length).toBeGreaterThanOrEqual(0);
      expect(result.index.fileIndex.length).toBeGreaterThan(0);
    });

    it('should provide meaningful error messages', async () => {
      const invalidInput: CodebaseInput = {
        files: [],
        metadata: { name: 'empty-project' },
      };

      try {
        await fileIndexer.indexCodebase(invalidInput);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('No files provided for indexing');
        expect(error.code).toBe('FILE_INDEXING_FAILED');
        expect(error.category).toBe('analysis');
      }
    });
  });
});
