import { AST } from '../types/codebase';
import { FileIndexEntry } from '../types/codebase';
import { ErrorFactory, ErrorCodes } from '../utils/error-handler';

/**
 * Supported programming languages for AST parsing
 */
export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'csharp'
  | 'php'
  | 'ruby';

/**
 * AST parsing options
 */
export interface ASTParserOptions {
  /**
   * Maximum number of files to parse
   */
  maxFiles?: number;

  /**
   * Maximum file size to parse (in bytes)
   */
  maxFileSize?: number;

  /**
   * Languages to enable parsing for
   */
  enabledLanguages?: SupportedLanguage[];

  /**
   * Whether to cache parsed ASTs
   */
  enableCaching?: boolean;

  /**
   * Parse timeout in milliseconds
   */
  parseTimeout?: number;

  /**
   * Whether to include detailed node information
   */
  includeDetails?: boolean;
}

/**
 * AST parsing result
 */
export interface ASTParsingResult {
  ast: AST;
  language: SupportedLanguage;
  parseTime: number;
  nodeCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Batch AST parsing result
 */
export interface BatchASTResult {
  results: Map<string, ASTParsingResult>;
  statistics: {
    totalFiles: number;
    successfulParses: number;
    failedParses: number;
    totalParseTime: number;
    averageParseTime: number;
    cacheHits: number;
    cacheMisses: number;
  };
  errors: string[];
}

/**
 * AST node information
 */
export interface ASTNodeInfo {
  type: string;
  name?: string;
  line?: number;
  column?: number;
  children: ASTNodeInfo[];
  metadata: Record<string, any>;
}

/**
 * Simplified AST representation for analysis
 */
export interface SimplifiedAST extends AST {
  language: SupportedLanguage;
  imports: ImportInfo[];
  exports: ExportInfo[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  variables: VariableInfo[];
  dependencies: string[];
  complexity: ComplexityMetrics;
}

/**
 * Import information
 */
export interface ImportInfo {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isDynamic: boolean;
  line?: number;
}

/**
 * Export information
 */
export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'variable' | 'default';
  isDefault: boolean;
  line?: number;
}

/**
 * Function information
 */
export interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  complexity: number;
  line?: number;
}

/**
 * Parameter information
 */
export interface ParameterInfo {
  name: string;
  type?: string;
  isOptional: boolean;
  defaultValue?: string;
}

/**
 * Class information
 */
export interface ClassInfo {
  name: string;
  extends?: string;
  implements: string[];
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  isExported: boolean;
  line?: number;
}

/**
 * Property information
 */
export interface PropertyInfo {
  name: string;
  type?: string;
  isStatic: boolean;
  isPrivate: boolean;
  line?: number;
}

/**
 * Variable information
 */
export interface VariableInfo {
  name: string;
  type?: string;
  isConst: boolean;
  isExported: boolean;
  line?: number;
}

/**
 * Complexity metrics
 */
export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
}

/**
 * Selective AST parser that parses only critical files
 */
export class ASTParser {
  private options: Required<ASTParserOptions>;
  private astCache: Map<string, ASTParsingResult>;

  constructor(options?: ASTParserOptions) {
    this.options = {
      maxFiles: 100,
      maxFileSize: 1024 * 1024, // 1MB
      enabledLanguages: ['javascript', 'typescript', 'python', 'java', 'go'],
      enableCaching: true,
      parseTimeout: 5000, // 5 seconds
      includeDetails: true,
      ...options,
    };
    this.astCache = new Map();
  }

  /**
   * Parse AST for a single file
   */
  async parseFile(
    path: string,
    content: string,
    language?: SupportedLanguage
  ): Promise<ASTParsingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Determine language if not provided
      const detectedLanguage = language || this.detectLanguage(path);
      if (!detectedLanguage) {
        throw new Error(`Unsupported language for file: ${path}`);
      }

      // Check if language is enabled
      if (!this.options.enabledLanguages.includes(detectedLanguage)) {
        throw new Error(`Language ${detectedLanguage} is not enabled for parsing`);
      }

      // Check file size
      if (content.length > this.options.maxFileSize) {
        warnings.push(`File ${path} exceeds maximum size limit, parsing may be slow`);
      }

      // Check cache first
      const cacheKey = this.getCacheKey(path, content);
      if (this.options.enableCaching && this.astCache.has(cacheKey)) {
        const cached = this.astCache.get(cacheKey)!;
        return {
          ...cached,
          parseTime: Date.now() - startTime,
        };
      }

      // Parse AST based on language
      const ast = await this.parseByLanguage(content, detectedLanguage);
      const nodeCount = this.countNodes(ast);

      const result: ASTParsingResult = {
        ast,
        language: detectedLanguage,
        parseTime: Date.now() - startTime,
        nodeCount,
        errors,
        warnings,
      };

      // Cache result
      if (this.options.enableCaching) {
        this.astCache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      const parseTime = Date.now() - startTime;
      errors.push(error instanceof Error ? error.message : String(error));

      // Return minimal AST on error
      return {
        ast: this.createEmptyAST(),
        language: language || 'javascript',
        parseTime,
        nodeCount: 0,
        errors,
        warnings,
      };
    }
  }

  /**
   * Parse ASTs for multiple files (selective parsing)
   */
  async parseFiles(
    files: FileIndexEntry[],
    contents: Map<string, string>
  ): Promise<BatchASTResult> {
    const startTime = Date.now();
    const results = new Map<string, ASTParsingResult>();
    const errors: string[] = [];
    let successfulParses = 0;
    let failedParses = 0;
    let cacheHits = 0;
    let cacheMisses = 0;

    // Select top priority files for parsing
    const filesToParse = this.selectFilesForParsing(files);

    for (const file of filesToParse) {
      try {
        const content = contents.get(file.path);
        if (!content) {
          errors.push(`No content available for file: ${file.path}`);
          failedParses++;
          continue;
        }

        // Check cache first
        const cacheKey = this.getCacheKey(file.path, content);
        if (this.options.enableCaching && this.astCache.has(cacheKey)) {
          results.set(file.path, this.astCache.get(cacheKey)!);
          cacheHits++;
          successfulParses++;
          continue;
        }

        const result = await this.parseFile(file.path, content, file.language as SupportedLanguage);
        results.set(file.path, result);
        cacheMisses++;

        if (result.errors.length === 0) {
          successfulParses++;
        } else {
          failedParses++;
          errors.push(...result.errors.map(err => `${file.path}: ${err}`));
        }
      } catch (error) {
        failedParses++;
        errors.push(
          `Failed to parse ${file.path}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    const totalParseTime = Date.now() - startTime;
    const averageParseTime = results.size > 0 ? totalParseTime / results.size : 0;

    return {
      results,
      statistics: {
        totalFiles: filesToParse.length,
        successfulParses,
        failedParses,
        totalParseTime,
        averageParseTime,
        cacheHits,
        cacheMisses,
      },
      errors,
    };
  }

  /**
   * Create simplified AST with extracted information
   */
  async createSimplifiedAST(
    path: string,
    content: string,
    language?: SupportedLanguage
  ): Promise<SimplifiedAST> {
    const parseResult = await this.parseFile(path, content, language);
    const ast = parseResult.ast;

    // Extract information based on language
    const imports = this.extractImports(ast, parseResult.language);
    const exports = this.extractExports(ast, parseResult.language);
    const functions = this.extractFunctions(ast, parseResult.language);
    const classes = this.extractClasses(ast, parseResult.language);
    const variables = this.extractVariables(ast, parseResult.language);
    const dependencies = this.extractDependencies(imports);
    const complexity = this.calculateComplexity(ast, content);

    return {
      ...ast,
      language: parseResult.language,
      imports,
      exports,
      functions,
      classes,
      variables,
      dependencies,
      complexity,
    };
  }

  /**
   * Select files for parsing based on priority
   */
  private selectFilesForParsing(files: FileIndexEntry[]): FileIndexEntry[] {
    return files
      .filter(file => {
        // Only parse source files with supported languages
        if (file.type !== 'source') return false;
        if (!file.language) return false;
        return this.options.enabledLanguages.includes(file.language as SupportedLanguage);
      })
      .filter(
        file => file.importance.category === 'critical' || file.importance.category === 'important'
      )
      .sort((a, b) => b.importance.score - a.importance.score)
      .slice(0, this.options.maxFiles);
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(path: string): SupportedLanguage | undefined {
    const extension = path.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, SupportedLanguage> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
    };

    return extension ? languageMap[extension] : undefined;
  }

  /**
   * Parse AST based on language (simplified implementation)
   */
  private async parseByLanguage(content: string, language: SupportedLanguage): Promise<AST> {
    // This is a simplified implementation
    // In a real scenario, you would use language-specific parsers like:
    // - @babel/parser for JavaScript/TypeScript
    // - ast module for Python
    // - JavaParser for Java
    // - go/parser for Go
    // etc.

    const lines = content.split('\n');
    const ast: AST = {
      type: 'Program',
      body: this.parseContent(content, language),
      sourceType: 'module',
    };

    return ast;
  }

  /**
   * Simplified content parsing (placeholder implementation)
   */
  private parseContent(content: string, language: SupportedLanguage): any[] {
    const body: any[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line.startsWith('#')) continue;

      // Detect different constructs based on language
      if (this.isImportStatement(line, language)) {
        body.push({
          type: 'ImportDeclaration',
          source: this.extractImportSource(line, language),
          line: i + 1,
        });
      } else if (this.isFunctionDeclaration(line, language)) {
        body.push({
          type: 'FunctionDeclaration',
          name: this.extractFunctionName(line, language),
          line: i + 1,
        });
      } else if (this.isClassDeclaration(line, language)) {
        body.push({
          type: 'ClassDeclaration',
          name: this.extractClassName(line, language),
          line: i + 1,
        });
      } else if (this.isVariableDeclaration(line, language)) {
        body.push({
          type: 'VariableDeclaration',
          name: this.extractVariableName(line, language),
          line: i + 1,
        });
      }
    }

    return body;
  }

  /**
   * Extract imports from AST
   */
  private extractImports(ast: AST, language: SupportedLanguage): ImportInfo[] {
    const imports: ImportInfo[] = [];

    for (const node of ast.body) {
      if (node.type === 'ImportDeclaration') {
        imports.push({
          source: node.source || '',
          specifiers: [],
          isDefault: false,
          isDynamic: false,
          line: node.line,
        });
      }
    }

    return imports;
  }

  /**
   * Extract exports from AST
   */
  private extractExports(ast: AST, language: SupportedLanguage): ExportInfo[] {
    const exports: ExportInfo[] = [];

    for (const node of ast.body) {
      if (node.type === 'ExportDeclaration') {
        exports.push({
          name: node.name || 'default',
          type: 'function',
          isDefault: node.isDefault || false,
          line: node.line,
        });
      }
    }

    return exports;
  }

  /**
   * Extract functions from AST
   */
  private extractFunctions(ast: AST, language: SupportedLanguage): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    for (const node of ast.body) {
      if (node.type === 'FunctionDeclaration') {
        functions.push({
          name: node.name || 'anonymous',
          parameters: [],
          isAsync: false,
          isExported: false,
          complexity: 1,
          line: node.line,
        });
      }
    }

    return functions;
  }

  /**
   * Extract classes from AST
   */
  private extractClasses(ast: AST, language: SupportedLanguage): ClassInfo[] {
    const classes: ClassInfo[] = [];

    for (const node of ast.body) {
      if (node.type === 'ClassDeclaration') {
        classes.push({
          name: node.name || 'Anonymous',
          implements: [],
          methods: [],
          properties: [],
          isExported: false,
          line: node.line,
        });
      }
    }

    return classes;
  }

  /**
   * Extract variables from AST
   */
  private extractVariables(ast: AST, language: SupportedLanguage): VariableInfo[] {
    const variables: VariableInfo[] = [];

    for (const node of ast.body) {
      if (node.type === 'VariableDeclaration') {
        variables.push({
          name: node.name || 'unknown',
          isConst: false,
          isExported: false,
          line: node.line,
        });
      }
    }

    return variables;
  }

  /**
   * Extract dependencies from imports
   */
  private extractDependencies(imports: ImportInfo[]): string[] {
    return imports
      .map(imp => imp.source)
      .filter(source => !source.startsWith('.')) // External dependencies only
      .filter((source, index, arr) => arr.indexOf(source) === index); // Unique
  }

  /**
   * Calculate complexity metrics
   */
  private calculateComplexity(ast: AST, content: string): ComplexityMetrics {
    const lines = content.split('\n');
    const linesOfCode = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;

    // Simplified complexity calculation
    let cyclomaticComplexity = 1; // Base complexity
    let cognitiveComplexity = 0;

    for (const node of ast.body) {
      if (node.type === 'FunctionDeclaration') {
        cyclomaticComplexity += 1;
        cognitiveComplexity += 1;
      }
    }

    const maintainabilityIndex = Math.max(
      0,
      171 - 5.2 * Math.log(linesOfCode) - 0.23 * cyclomaticComplexity
    );

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode,
      maintainabilityIndex,
    };
  }

  // Helper methods for parsing different language constructs
  private isImportStatement(line: string, language: SupportedLanguage): boolean {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return line.includes('import ') || line.includes('require(');
      case 'python':
        return line.startsWith('import ') || line.startsWith('from ');
      case 'java':
        return line.startsWith('import ');
      case 'go':
        return line.includes('import ');
      default:
        return false;
    }
  }

  private isFunctionDeclaration(line: string, language: SupportedLanguage): boolean {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return line.includes('function ') || line.includes('=>');
      case 'python':
        return line.startsWith('def ');
      case 'java':
        return line.includes('public ') && line.includes('(');
      case 'go':
        return line.startsWith('func ');
      default:
        return false;
    }
  }

  private isClassDeclaration(line: string, language: SupportedLanguage): boolean {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return line.includes('class ');
      case 'python':
        return line.startsWith('class ');
      case 'java':
        return line.includes('class ') || line.includes('interface ');
      default:
        return false;
    }
  }

  private isVariableDeclaration(line: string, language: SupportedLanguage): boolean {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return line.includes('const ') || line.includes('let ') || line.includes('var ');
      case 'python':
        return line.includes(' = ') && !line.startsWith('def ') && !line.startsWith('class ');
      case 'java':
        return line.includes(' = ') && (line.includes('int ') || line.includes('String '));
      case 'go':
        return line.includes(':=') || line.includes('var ');
      default:
        return false;
    }
  }

  private extractImportSource(line: string, language: SupportedLanguage): string {
    // Simplified extraction
    const match = line.match(/['"`]([^'"`]+)['"`]/);
    return match ? match[1] : '';
  }

  private extractFunctionName(line: string, language: SupportedLanguage): string {
    switch (language) {
      case 'javascript':
      case 'typescript':
        const jsMatch = line.match(/function\s+(\w+)/);
        return jsMatch ? jsMatch[1] : 'anonymous';
      case 'python':
        const pyMatch = line.match(/def\s+(\w+)/);
        return pyMatch ? pyMatch[1] : 'anonymous';
      default:
        return 'anonymous';
    }
  }

  private extractClassName(line: string, language: SupportedLanguage): string {
    const match = line.match(/class\s+(\w+)/);
    return match ? match[1] : 'Anonymous';
  }

  private extractVariableName(line: string, language: SupportedLanguage): string {
    switch (language) {
      case 'javascript':
      case 'typescript':
        const jsMatch = line.match(/(const|let|var)\s+(\w+)/);
        return jsMatch ? jsMatch[2] : 'unknown';
      default:
        return 'unknown';
    }
  }

  private countNodes(ast: AST): number {
    let count = 1; // Count the root node
    if (ast.body && Array.isArray(ast.body)) {
      count += ast.body.length;
    }
    return count;
  }

  private createEmptyAST(): AST {
    return {
      type: 'Program',
      body: [],
      sourceType: 'module',
    };
  }

  private getCacheKey(path: string, content: string): string {
    // Simple hash function for caching
    let hash = 0;
    const str = path + content.substring(0, 1000); // Use first 1000 chars for hash
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Clear AST cache
   */
  clearCache(): void {
    this.astCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.astCache.size,
      keys: Array.from(this.astCache.keys()),
    };
  }
}
