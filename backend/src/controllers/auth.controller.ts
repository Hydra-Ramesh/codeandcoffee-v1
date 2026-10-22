import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data.name, data.email, data.password);
      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data.email, data.password);
      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: { user: req.user },
      });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.requestPasswordResetOtp(data.email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = verifyOtpSchema.parse(req.body);
      const result = await AuthService.verifyOtp(data.email, data.otp);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const result = await AuthService.resetPasswordWithOtp(data.email, data.otp, data.newPassword);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // OAuth Mock/Direct exchange endpoint (for seamless client integration)
  static async oauthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider, email, name, avatar, id } = req.body;
      if (!email || !provider) {
        res.status(400).json({ success: false, message: 'Provider and email are required.' });
        return;
      }
      const result = await AuthService.handleOAuthUser(provider as 'google' | 'github', {
        id: id || `${provider}_${Date.now()}`,
        email,
        name: name || (provider === 'google' ? 'Google Developer' : 'GitHub Coder'),
        avatar,
      });
      res.status(200).json({
        success: true,
        message: `Successfully authenticated via ${provider}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
