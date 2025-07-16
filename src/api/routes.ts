import { Router } from 'express';

/**
 * Interface for API route handlers
 */
export interface ApiRoutes {
  /**
   * Gets the Express router with all routes configured
   */
  getRouter(): Router;

  /**
   * Sets up codebase analysis routes
   */
  setupAnalysisRoutes(): void;

  /**
   * Sets up configuration generation routes
   */
  setupGenerationRoutes(): void;

  /**
   * Sets up recommendation routes
   */
  setupRecommendationRoutes(): void;

  /**
   * Sets up health check and utility routes
   */
  setupUtilityRoutes(): void;
}

/**
 * Default implementation of API routes
 */
export class DefaultApiRoutes implements ApiRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  setupAnalysisRoutes(): void {
    // Implementation will be added in later tasks
    this.router.post('/analyze', (req, res) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });
  }

  setupGenerationRoutes(): void {
    // Implementation will be added in later tasks
    this.router.post('/generate/docker', (req, res) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });

    this.router.post('/generate/kubernetes', (req, res) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });

    this.router.post('/generate/cicd', (req, res) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });
  }

  setupRecommendationRoutes(): void {
    // Implementation will be added in later tasks
    this.router.post('/recommend', (req, res) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });

    this.router.post('/cost-estimate', (req, res) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });
  }

  setupUtilityRoutes(): void {
    this.router.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.router.get('/version', (req, res) => {
      res.json({ version: '1.0.0', name: 'AutoInfra Agent' });
    });
  }

  private setupRoutes(): void {
    this.setupAnalysisRoutes();
    this.setupGenerationRoutes();
    this.setupRecommendationRoutes();
    this.setupUtilityRoutes();
  }
}
