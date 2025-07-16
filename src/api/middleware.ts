import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Interface for API middleware
 */
export interface ApiMiddleware {
  /**
   * Logs incoming requests
   */
  requestLogger(req: Request, res: Response, next: NextFunction): void;

  /**
   * Handles errors in API routes
   */
  errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void;

  /**
   * Validates request content type
   */
  validateContentType(req: Request, res: Response, next: NextFunction): void;

  /**
   * Adds security headers
   */
  securityHeaders(req: Request, res: Response, next: NextFunction): void;
}

/**
 * Default implementation of API middleware
 */
export class DefaultApiMiddleware implements ApiMiddleware {
  requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.path}`, {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    });

    next();
  }

  errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
    logger.error('API Error', error, {
      method: req.method,
      path: req.path,
      body: req.body,
    });

    if (res.headersSent) {
      return next(error);
    }

    const statusCode = (error as any).statusCode || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message;

    res.status(statusCode).json({
      error: {
        message,
        code: (error as any).code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
    });
  }

  validateContentType(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({
          error: {
            message: 'Content-Type must be application/json',
            code: 'INVALID_CONTENT_TYPE',
          },
        });
      }
    }
    next();
  }

  securityHeaders(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  }
}
