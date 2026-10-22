import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('🔥 Server Error Encountered:', err);

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed for request data.',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle JWT token errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Authorization token has expired. Please log in again.',
    });
    return;
  }

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
