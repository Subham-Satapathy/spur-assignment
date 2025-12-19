/**
 * Base error class for all domain errors
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends DomainError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * LLM/AI provider errors (503)
 */
export class LLMError extends DomainError {
  constructor(message: string, details?: any) {
    super(message, 'LLM_ERROR', 503, details);
  }
}

/**
 * Database errors (500)
 */
export class DatabaseError extends DomainError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends DomainError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT_ERROR', 429);
  }
}

/**
 * Configuration errors (500)
 */
export class ConfigurationError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 500);
  }
}
