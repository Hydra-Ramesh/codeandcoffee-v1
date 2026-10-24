import { Request, Response, NextFunction } from 'express';

/**
 * Anti-Bot Honeypot Security Middleware
 * Transparent to legitimate users. Bots and automated headless scripts that auto-fill
 * invisible form inputs (e.g. `website_trap`) are trapped and safely neutralized.
 */
export function honeypotCheck(req: Request, res: Response, next: NextFunction): void {
  const trapValue = req.body?.website_trap || req.body?.hp_field;

  if (trapValue && typeof trapValue === 'string' && trapValue.trim().length > 0) {
    console.warn(`[Anti-Bot Honeypot] Trapped automated bot submission from IP: ${req.ip}`);
    // Silently succeed to not give bot clues, but drop execution immediately
    res.status(200).json({
      success: true,
      message: 'Inquiry received and queued for review.',
    });
    return;
  }

  next();
}
