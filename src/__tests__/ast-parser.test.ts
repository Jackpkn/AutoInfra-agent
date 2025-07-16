import { describe, it, expect, beforeEach } from 'vitest';
import { ASTParser, ASTParserOptions, SupportedLanguage } from '../analyzers/ast-parser';
import { FileIndexEntry } from '../types/codebase';

describe('ASTParser', () => {
  let parser: ASTParser;

  beforeEach(() => {
    parser = new ASTParser();
  });

  describe('parseFile', () => {
    it('should parse a JavaScript file successfully', async () => {
      const content = `
        import React from 'react';
        
        function HelloWorld() {
          const message = 'Hello, World!';
          return <div>{message}</div>;
        }
        
        export default HelloWorld;
      `;

      const result = await parser.parseFile('src/HelloWorld.js', content, 'javascript');

      expect(result.language).toBe('javascript');
      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('Program');
      expect(result.nodeCount).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(result.parseTime).toBeGreaterThan(0);
    });

    it('should parse a TypeScript file successfully', async () => {
      const content = `
        interface User {
          id: number;
          name: string;
        }
        
        class UserService {
          async getUser(id: number): Promise<User> {
            return { id, name: 'Test User' };
          }
        }
        
        export { UserService, User };
      `;

      const result = await parser.parseFile('src/UserService.ts', content, 'typescript');

      expect(result.language).toBe('typescript');
      expect(result.ast.body).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse a Python file successfully', async () => {
      const content = `
        import os
        from typing import List
        
        class DataProcessor:
            def __init__(self):
                self.data = []
            
            def process_data(self, items: List[str]) -> List[str]:
                return [item.upper() for item in items]
        
        def main():
            processor = DataProcessor()
            result = processor.process_data(['hello', 'world'])
            print(result)
      `;

      const result = await parser.parseFile('src/processor.py', content, 'python');

      expect(result.language).toBe('python');
      expect(result.ast.body).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should detect language from file extension', async () => {
      const jsContent = 'const x = 1;';
      const pyContent = 'x = 1';

      const jsResult = await parser.parseFile('test.js', jsContent);
      const pyResult = await parser.parseFile('test.py', pyContent);

      expect(jsResult.language).toBe('javascript');
      expect(pyResult.language).toBe('python');
    });

    it('should handle unsupported languages gracefully', async () => {
      const content = 'some content';
      const result = await parser.parseFile('test.unknown', content);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Unsupported language');
    });

    it('should handle parsing errors gracefully', async () => {
      const invalidContent = 'function {{{ invalid syntax';
      const result = await parser.parseFile('test.js', invalidContent, 'javascript');

      expect(result.ast).toBeDefined();
      expect(result.nodeCount).toBe(0);
    });

    it('should warn about large files', async () => {
      const largeContent = 'x = 1\n'.repeat(100000);
      const result = await parser.parseFile('large.py', largeContent, 'python');

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('exceeds maximum size limit');
    });

    it('should use caching when enabled', async () => {
      const content = 'const x = 1;';

      const result1 = await parser.parseFile('test.js', content, 'javascript');
      const result2 = await parser.parseFile('test.js', content, 'javascript');

      expect(result1.ast).toEqual(result2.ast);
      expect(parser.getCacheStats().size).toBeGreaterThan(0);
    });
  });

  describe('parseFiles (batch parsing)', () => {
    it('should parse multiple files selectively', async () => {
      const files: FileIndexEntry[] = [
        {
          path: 'src/index.js',
          type: 'source',
          size: 100,
          importance: { score: 120, reasons: ['Entry point'], category: 'critical' },
          language: 'javascript',
          lastModified: new Date(),
        },
        {
          path: 'src/utils.js',
          type: 'source',
          size: 200,
          importance: { score: 80, reasons: ['Utility'], category: 'important' },
          language: 'javascript',
          lastModified: new Date(),
        },
        {
          path: 'src/test.js',
          type: 'test',
          size: 150,
          importance: { score: 30, reasons: ['Test'], category: 'normal' },
          language: 'javascript',
          lastModified: new Date(),
        },
      ];

      const contents = new Map([
        ['src/index.js', 'console.log("index");'],
        ['src/utils.js', 'function helper() { return true; }'],
        ['src/test.js', 'describe("test", () => {});'],
      ]);

      const result = await parser.parseFiles(files, contents);

      expect(result.results.size).toBe(2); // Only critical and important files
      expect(result.results.has('src/index.js')).toBe(true);
      expect(result.results.has('src/utils.js')).toBe(true);
      expect(result.results.has('src/test.js')).toBe(false); // Test file excluded
      expect(result.statistics.successfulParses).toBe(2);
      expect(result.statistics.failedParses).toBe(0);
    });

    it('should handle missing content gracefully', async () => {
      const files: FileIndexEntry[] = [
        {
          path: 'src/missing.js',
          type: 'source',
          size: 100,
          importance: { score: 120, reasons: ['Entry point'], category: 'critical' },
          language: 'javascript',
          lastModified: new Date(),
        },
      ];

      const contents = new Map(); // Empty contents

      const result = await parser.parseFiles(files, contents);

      expect(result.statistics.failedParses).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('No content available');
    });

    it('should respect maxFiles limit', async () => {
      const limitedParser = new ASTParser({ maxFiles: 2 });

      const files: FileIndexEntry[] = Array.from({ length: 5 }, (_, i) => ({
        path: `src/file${i}.js`,
        type: 'source',
        size: 100,
        importance: { score: 100 - i * 10, reasons: ['Source'], category: 'critical' },
        language: 'javascript',
        lastModified: new Date(),
      }));

      const contents = new Map(files.map(file => [file.path, `console.log("${file.path}");`]));

      const result = await limitedParser.parseFiles(files, contents);

      expect(result.results.size).toBeLessThanOrEqual(2);
      expect(result.statistics.totalFiles).toBeLessThanOrEqual(2);
    });
  });

  describe('createSimplifiedAST', () => {
    it('should create simplified AST with extracted information', async () => {
      const content = `
        import React from 'react';
        import { useState } from 'react';
        
        export class UserComponent {
          constructor(props) {
            this.props = props;
          }
          
          render() {
            return <div>User</div>;
          }
        }
        
        export function useUser() {
          const [user, setUser] = useState(null);
          return { user, setUser };
        }
        
        export default UserComponent;
      `;

      const result = await parser.createSimplifiedAST('src/User.js', content, 'javascript');

      expect(result.language).toBe('javascript');
      expect(result.imports).toBeDefined();
      expect(result.exports).toBeDefined();
      expect(result.functions).toBeDefined();
      expect(result.classes).toBeDefined();
      expect(result.variables).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.complexity).toBeDefined();
      expect(result.complexity.linesOfCode).toBeGreaterThan(0);
    });

    it('should extract imports correctly', async () => {
      const content = `
        import React from 'react';
        import { Component } from 'react';
        const fs = require('fs');
      `;

      const result = await parser.createSimplifiedAST('test.js', content, 'javascript');

      expect(result.imports.length).toBeGreaterThan(0);
      expect(result.dependencies).toContain('react');
    });

    it('should extract functions correctly', async () => {
      const content = `
        function regularFunction() {
          return 'hello';
        }
        
        const arrowFunction = () => {
          return 'world';
        };
        
        async function asyncFunction() {
          return await Promise.resolve('async');
        }
      `;

      const result = await parser.createSimplifiedAST('test.js', content, 'javascript');

      expect(result.functions.length).toBeGreaterThan(0);
    });

    it('should extract classes correctly', async () => {
      const content = `
        class BaseClass {
          constructor() {
            this.value = 0;
          }
        }
        
        class ExtendedClass extends BaseClass {
          method() {
            return this.value;
          }
        }
      `;

      const result = await parser.createSimplifiedAST('test.js', content, 'javascript');

      expect(result.classes.length).toBeGreaterThan(0);
    });

    it('should calculate complexity metrics', async () => {
      const complexContent = `
        function complexFunction(x) {
          if (x > 0) {
            for (let i = 0; i < x; i++) {
              if (i % 2 === 0) {
                console.log(i);
              } else {
                console.log('odd');
              }
            }
          } else {
            throw new Error('Invalid input');
          }
        }
      `;

      const result = await parser.createSimplifiedAST('complex.js', complexContent, 'javascript');

      expect(result.complexity.cyclomaticComplexity).toBeGreaterThan(1);
      expect(result.complexity.linesOfCode).toBeGreaterThan(0);
      expect(result.complexity.maintainabilityIndex).toBeGreaterThan(0);
    });
  });

  describe('language-specific parsing', () => {
    it('should handle JavaScript/TypeScript imports', async () => {
      const content = `
        import defaultExport from 'module';
        import { namedExport } from 'module';
        import * as namespace from 'module';
        const dynamicImport = require('module');
      `;

      const result = await parser.parseFile('test.js', content, 'javascript');

      expect(result.ast.body.some((node: any) => node.type === 'ImportDeclaration')).toBe(true);
    });

    it('should handle Python imports', async () => {
      const content = `
        import os
        import sys
        from typing import List, Dict
        from .local_module import function
      `;

      const result = await parser.parseFile('test.py', content, 'python');

      expect(result.ast.body.some((node: any) => node.type === 'ImportDeclaration')).toBe(true);
    });

    it('should handle Java imports', async () => {
      const content = `
        import java.util.List;
        import java.util.ArrayList;
        import static java.lang.Math.PI;
        
        public class Example {
          public void method() {}
        }
      `;

      const result = await parser.parseFile('Example.java', content, 'java');

      expect(result.ast.body.some((node: any) => node.type === 'ImportDeclaration')).toBe(true);
    });

    it('should handle Go imports', async () => {
      const content = `
        package main
        
        import (
          "fmt"
          "net/http"
        )
        
        func main() {
          fmt.Println("Hello, World!")
        }
      `;

      const result = await parser.parseFile('main.go', content, 'go');

      expect(result.ast.body.some((node: any) => node.type === 'ImportDeclaration')).toBe(true);
    });
  });

  describe('configuration options', () => {
    it('should respect enabled languages', async () => {
      const restrictedParser = new ASTParser({
        enabledLanguages: ['javascript'],
      });

      const jsResult = await restrictedParser.parseFile('test.js', 'const x = 1;', 'javascript');
      const pyResult = await restrictedParser.parseFile('test.py', 'x = 1', 'python');

      expect(jsResult.errors).toHaveLength(0);
      expect(pyResult.errors.length).toBeGreaterThan(0);
      expect(pyResult.errors[0]).toContain('not enabled');
    });

    it('should disable caching when configured', async () => {
      const noCacheParser = new ASTParser({ enableCaching: false });

      await noCacheParser.parseFile('test.js', 'const x = 1;', 'javascript');

      expect(noCacheParser.getCacheStats().size).toBe(0);
    });

    it('should respect file size limits', async () => {
      const smallLimitParser = new ASTParser({ maxFileSize: 10 });
      const largeContent = 'x = 1\n'.repeat(100);

      const result = await smallLimitParser.parseFile('test.py', largeContent, 'python');

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle empty content', async () => {
      const result = await parser.parseFile('empty.js', '', 'javascript');

      expect(result.ast).toBeDefined();
      expect(result.nodeCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle malformed content', async () => {
      const malformedContent = 'function { invalid syntax }{{{';
      const result = await parser.parseFile('malformed.js', malformedContent, 'javascript');

      expect(result.ast).toBeDefined();
      // Should not throw, but may have errors
    });

    it('should handle very large files', async () => {
      const hugeContent = 'x = 1\n'.repeat(1000000);
      const result = await parser.parseFile('huge.py', hugeContent, 'python');

      expect(result).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('caching', () => {
    it('should cache parsing results', async () => {
      const content = 'const x = 1;';

      await parser.parseFile('test.js', content, 'javascript');
      const cacheStats = parser.getCacheStats();

      expect(cacheStats.size).toBeGreaterThan(0);
      expect(cacheStats.keys.length).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      await parser.parseFile('test.js', 'const x = 1;', 'javascript');

      parser.clearCache();

      expect(parser.getCacheStats().size).toBe(0);
    });

    it('should use different cache keys for different content', async () => {
      await parser.parseFile('test.js', 'const x = 1;', 'javascript');
      await parser.parseFile('test.js', 'const y = 2;', 'javascript');

      const cacheStats = parser.getCacheStats();
      expect(cacheStats.size).toBe(2);
    });
  });

  describe('complexity analysis', () => {
    it('should calculate cyclomatic complexity', async () => {
      const complexContent = `
        function complex(x) {
          if (x > 0) {
            if (x > 10) {
              return 'big';
            } else {
              return 'small';
            }
          } else {
            return 'negative';
          }
        }
      `;

      const result = await parser.createSimplifiedAST('complex.js', complexContent, 'javascript');

      expect(result.complexity.cyclomaticComplexity).toBeGreaterThan(1);
    });

    it('should count lines of code correctly', async () => {
      const content = `
        // This is a comment
        function test() {
          const x = 1;
          const y = 2;
          return x + y;
        }
        
        // Another comment
      `;

      const result = await parser.createSimplifiedAST('test.js', content, 'javascript');

      expect(result.complexity.linesOfCode).toBe(4); // Excluding comments and empty lines
    });
  });

  describe('edge cases', () => {
    it('should handle files with only comments', async () => {
      const commentOnlyContent = `
        // This is a comment
        /* This is a block comment */
        # Python comment
      `;

      const result = await parser.parseFile('comments.js', commentOnlyContent, 'javascript');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should handle mixed language content', async () => {
      const mixedContent = `
        // JavaScript-like syntax
        const x = 1;
        
        # Python-like comment
        def function():
            pass
      `;

      const result = await parser.parseFile('mixed.js', mixedContent, 'javascript');

      expect(result.ast).toBeDefined();
      // Should parse as JavaScript, ignoring Python syntax
    });

    it('should handle unicode content', async () => {
      const unicodeContent = `
        const message = "Hello, 世界! 🌍";
        function greet(名前) {
          return \`こんにちは、\${名前}さん！\`;
        }
      `;

      const result = await parser.parseFile('unicode.js', unicodeContent, 'javascript');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });
});
