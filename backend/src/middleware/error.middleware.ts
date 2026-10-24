import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isProd = process.env.NODE_ENV === 'production';

  // Redact stack/sensitive traces in production server log
  if (isProd) {
    console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err.message || 'Unknown error');
  } else {
    console.error('🔥 Server Error Encountered:', err);
  }

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

  // Handle Prisma Database Errors (Prevent schema/table/field leaks)
  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists.`,
    });
    return;
  }

  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'The requested record could not be found or has already been removed.',
    });
    return;
  }

  if (err.code === 'P2003') {
    res.status(400).json({
      success: false,
      message: 'Database relationship constraint violation.',
    });
    return;
  }

  if (err.name === 'PrismaClientInitializationError' || err.name === 'PrismaClientRustPanicError') {
    res.status(503).json({
      success: false,
      message: 'Database service is temporarily unavailable. Please retry in a few moments.',
    });
    return;
  }

  // Handle invalid login credentials
  if (err.message === 'Invalid email or password.' || err.message?.includes('Invalid credentials')) {
    res.status(401).json({
      success: false,
      message: err.message,
    });
    return;
  }

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // In production, prevent leaking raw database error messages or internal system paths
  const userFacingMessage =
    isProd && statusCode === 500
      ? 'An unexpected internal server error occurred. Please contact engineering support if the issue persists.'
      : err.message || 'An unexpected error occurred.';

  res.status(statusCode).json({
    success: false,
    message: userFacingMessage,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
