import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'CONTRIBUTOR' | 'ADMIN';
  isBanned?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;

    // Check user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, isBanned: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
      return;
    }

    req.user = user as AuthUser;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired authorization token.' });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required for this action.',
    });
    return;
  }

  next();
}

export function requireContributorOrAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'CONTRIBUTOR') {
    res.status(403).json({
      success: false,
      message: 'Access denied: Contributor or Administrator privileges required to author articles.',
    });
    return;
  }

  next();
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, isBanned: true },
    });

    if (user && !user.isBanned) {
      req.user = user as AuthUser;
    }
  } catch {
    // Non-fatal for optional auth
  }
  next();
}
