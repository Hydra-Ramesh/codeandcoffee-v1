import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';

import { CacheService } from '../services/cache.service.js';

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

async function getCachedAuthUser(userId: string): Promise<AuthUser | null> {
  const cacheKey = `user:session:${userId}`;
  const cached = await CacheService.get<AuthUser>(cacheKey);
  if (cached) {
    return cached;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, isBanned: true },
  });

  if (user) {
    // Cache active user session in Redis for 300 seconds (5 minutes)
    await CacheService.set(cacheKey, user, 300);
  }

  return user as AuthUser | null;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. No session or token provided.' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;

    // Check user in Redis session cache or database
    const user = await getCachedAuthUser(decoded.id);

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
  const cookieToken = req.cookies?.token;
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    const user = await getCachedAuthUser(decoded.id);

    if (user && !user.isBanned) {
      req.user = user as AuthUser;
    }
  } catch {
    // Non-fatal for optional auth
  }
  next();
}
