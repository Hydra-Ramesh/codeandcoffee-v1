import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { config } from '../config/env.js';

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

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data.name, data.email, data.password);
      if (result.accessToken) {
        res.cookie('token', result.accessToken, AUTH_COOKIE_OPTIONS);
      }
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          ...AUTH_COOKIE_OPTIONS,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
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
      if (result.accessToken) {
        res.cookie('token', result.accessToken, AUTH_COOKIE_OPTIONS);
      }
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          ...AUTH_COOKIE_OPTIONS,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const incomingToken = req.body?.refreshToken || req.cookies?.refreshToken;
      if (!incomingToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token is required.',
        });
        return;
      }

      const result = await AuthService.rotateRefreshToken(incomingToken);

      res.cookie('token', result.accessToken, AUTH_COOKIE_OPTIONS);
      res.cookie('refreshToken', result.refreshToken, {
        ...AUTH_COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Tokens rotated successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
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

  // --- Real Google OAuth2 Redirection & Callback ---
  static initiateGoogleOAuth(req: Request, res: Response) {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: config.oauth.google.clientId,
      redirect_uri: config.oauth.google.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    res.redirect(`${rootUrl}?${params.toString()}`);
  }

  static async handleGoogleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, error } = req.query;

      if (error || !code) {
        console.warn('Google OAuth returned error or was cancelled:', error);
        res.redirect(`${config.clientUrl}/auth/login?error=${encodeURIComponent('Google login was cancelled or failed.')}`);
        return;
      }

      // Exchange authorization code for tokens
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: config.oauth.google.clientId,
          client_secret: config.oauth.google.clientSecret,
          redirect_uri: config.oauth.google.callbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = (await tokenResponse.json()) as any;

      if (!tokenData.access_token) {
        console.error('Failed to exchange code with Google:', tokenData);
        res.redirect(
          `${config.clientUrl}/auth/login?error=${encodeURIComponent(
            tokenData.error_description || 'Failed to exchange authorization token with Google'
          )}`
        );
        return;
      }

      // Fetch user profile from Google UserInfo endpoint
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleProfile = (await userInfoResponse.json()) as any;

      if (!googleProfile.email) {
        res.redirect(`${config.clientUrl}/auth/login?error=${encodeURIComponent('Could not retrieve email from Google profile.')}`);
        return;
      }

      const result = await AuthService.handleOAuthUser('google', {
        id: googleProfile.id || `google_${Date.now()}`,
        email: googleProfile.email,
        name: googleProfile.name || googleProfile.given_name || 'Google Developer',
        avatar: googleProfile.picture,
      });

      if (result.accessToken) {
        res.cookie('token', result.accessToken, AUTH_COOKIE_OPTIONS);
      }

      // Redirect to frontend callback page with tokens
      res.redirect(
        `${config.clientUrl}/auth/callback?token=${encodeURIComponent(result.accessToken)}&refreshToken=${encodeURIComponent(
          result.refreshToken
        )}`
      );
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      res.redirect(`${config.clientUrl}/auth/login?error=${encodeURIComponent('An error occurred during Google sign-in.')}`);
    }
  }

  // --- Real GitHub OAuth Redirection & Callback ---
  static initiateGithubOAuth(req: Request, res: Response) {
    const rootUrl = 'https://github.com/login/oauth/authorize';
    const params = new URLSearchParams({
      client_id: config.oauth.github.clientId,
      redirect_uri: config.oauth.github.callbackUrl,
      scope: 'read:user user:email',
    });
    res.redirect(`${rootUrl}?${params.toString()}`);
  }

  static async handleGithubCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, error } = req.query;

      if (error || !code) {
        console.warn('GitHub OAuth returned error or was cancelled:', error);
        res.redirect(`${config.clientUrl}/auth/login?error=${encodeURIComponent('GitHub login was cancelled or failed.')}`);
        return;
      }

      // Exchange authorization code for token
      const tokenUrl = 'https://github.com/login/oauth/access_token';
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: config.oauth.github.clientId,
          client_secret: config.oauth.github.clientSecret,
          code: String(code),
          redirect_uri: config.oauth.github.callbackUrl,
        }),
      });

      const tokenData = (await tokenResponse.json()) as any;

      if (!tokenData.access_token) {
        console.error('Failed to exchange code with GitHub:', tokenData);
        res.redirect(
          `${config.clientUrl}/auth/login?error=${encodeURIComponent(
            tokenData.error_description || 'Failed to exchange authorization token with GitHub'
          )}`
        );
        return;
      }

      // Fetch user profile from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'CodeAndCoffee-OAuth-App',
        },
      });
      const githubProfile = (await userResponse.json()) as any;

      let email = githubProfile.email;
      if (!email) {
        // Fetch emails list if primary email is private
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'CodeAndCoffee-OAuth-App',
          },
        });
        const emails = (await emailsResponse.json()) as any;
        if (Array.isArray(emails)) {
          const primary = emails.find((e: any) => e.primary && e.verified) || emails[0];
          email = primary?.email;
        }
      }

      if (!email) {
        email = `${githubProfile.login}@users.noreply.github.com`;
      }

      const result = await AuthService.handleOAuthUser('github', {
        id: String(githubProfile.id),
        email,
        name: githubProfile.name || githubProfile.login,
        avatar: githubProfile.avatar_url,
      });

      if (result.accessToken) {
        res.cookie('token', result.accessToken, AUTH_COOKIE_OPTIONS);
      }

      res.redirect(
        `${config.clientUrl}/auth/callback?token=${encodeURIComponent(result.accessToken)}&refreshToken=${encodeURIComponent(
          result.refreshToken
        )}`
      );
    } catch (err) {
      console.error('GitHub OAuth callback error:', err);
      res.redirect(`${config.clientUrl}/auth/login?error=${encodeURIComponent('An error occurred during GitHub sign-in.')}`);
    }
  }

  // OAuth Mock/Direct exchange endpoint (for headless testing/backwards compatibility)
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

      if (result.accessToken) {
        res.cookie('token', result.accessToken, AUTH_COOKIE_OPTIONS);
      }

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
