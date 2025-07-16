import { AST, AnalysisResult } from '../types';

/**
 * Interface for cache management
 */
export interface CacheManager {
  /**
   * Gets cached AST for a file
   */
  getCachedAST(filePath: string, lastModified: Date): Promise<AST | null>;

  /**
   * Sets cached AST for a file
   */
  setCachedAST(filePath: string, ast: AST, lastModified: Date): Promise<void>;

  /**
   * Gets cached analysis result
   */
  getCachedAnalysis(codebaseHash: string): Promise<AnalysisResult | null>;

  /**
   * Sets cached analysis result
   */
  setCachedAnalysis(codebaseHash: string, result: AnalysisResult): Promise<void>;

  /**
   * Invalidates cache for changed files
   */
  invalidateCache(changedFiles: string[]): Promise<void>;

  /**
   * Clears all cache
   */
  clearCache(): Promise<void>;

  /**
   * Gets cache statistics
   */
  getCacheStats(): Promise<CacheStats>;
}

export interface CacheStats {
  astCacheSize: number;
  analysisCacheSize: number;
  hitRate: number;
  totalRequests: number;
  totalHits: number;
}

/**
 * In-memory cache implementation
 */
export class InMemoryCacheManager implements CacheManager {
  private astCache = new Map<string, { ast: AST; lastModified: Date; timestamp: Date }>();
  private analysisCache = new Map<string, { result: AnalysisResult; timestamp: Date }>();
  private stats = {
    totalRequests: 0,
    totalHits: 0,
  };

  async getCachedAST(filePath: string, lastModified: Date): Promise<AST | null> {
    this.stats.totalRequests++;

    const cached = this.astCache.get(filePath);
    if (cached && cached.lastModified.getTime() === lastModified.getTime()) {
      this.stats.totalHits++;
      return cached.ast;
    }

    return null;
  }

  async setCachedAST(filePath: string, ast: AST, lastModified: Date): Promise<void> {
    this.astCache.set(filePath, {
      ast,
      lastModified,
      timestamp: new Date(),
    });
  }

  async getCachedAnalysis(codebaseHash: string): Promise<AnalysisResult | null> {
    this.stats.totalRequests++;

    const cached = this.analysisCache.get(codebaseHash);
    if (cached) {
      // Check if cache is still valid (e.g., less than 1 hour old)
      const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
      if (Date.now() - cached.timestamp.getTime() < maxAge) {
        this.stats.totalHits++;
        return cached.result;
      } else {
        // Remove expired cache
        this.analysisCache.delete(codebaseHash);
      }
    }

    return null;
  }

  async setCachedAnalysis(codebaseHash: string, result: AnalysisResult): Promise<void> {
    this.analysisCache.set(codebaseHash, {
      result,
      timestamp: new Date(),
    });
  }

  async invalidateCache(changedFiles: string[]): Promise<void> {
    for (const filePath of changedFiles) {
      this.astCache.delete(filePath);
    }

    // If any files changed, invalidate all analysis cache
    // (in a real implementation, we might be more selective)
    if (changedFiles.length > 0) {
      this.analysisCache.clear();
    }
  }

  async clearCache(): Promise<void> {
    this.astCache.clear();
    this.analysisCache.clear();
    this.stats.totalRequests = 0;
    this.stats.totalHits = 0;
  }

  async getCacheStats(): Promise<CacheStats> {
    const hitRate =
      this.stats.totalRequests > 0 ? this.stats.totalHits / this.stats.totalRequests : 0;

    return {
      astCacheSize: this.astCache.size,
      analysisCacheSize: this.analysisCache.size,
      hitRate,
      totalRequests: this.stats.totalRequests,
      totalHits: this.stats.totalHits,
    };
  }
}

// Default cache manager instance
export const cacheManager = new InMemoryCacheManager();
