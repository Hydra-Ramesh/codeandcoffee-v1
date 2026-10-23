import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.get('/me', authenticate, AuthController.getMe);
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/verify-otp', authLimiter, AuthController.verifyOtp);
router.post('/reset-password', authLimiter, AuthController.resetPassword);
router.post('/oauth-callback', AuthController.oauthCallback);

// Google OAuth2 Routes
router.get('/google', AuthController.initiateGoogleOAuth);
router.get('/google/callback', AuthController.handleGoogleCallback);

// GitHub OAuth Routes
router.get('/github', AuthController.initiateGithubOAuth);
router.get('/github/callback', AuthController.handleGithubCallback);

export default router;
