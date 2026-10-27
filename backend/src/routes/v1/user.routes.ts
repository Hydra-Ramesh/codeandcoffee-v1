import { Router } from 'express';
import { UserController } from '../../controllers/user.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// User self-profile endpoints
router.get('/profile', authenticate, UserController.getProfile);
router.put('/profile', authenticate, UserController.updateProfile);

// User sessions & device management
router.get('/sessions', authenticate, UserController.getUserSessions);
router.delete('/sessions/other', authenticate, UserController.revokeOtherSessions);
router.delete('/sessions/:id', authenticate, UserController.revokeSession);

// Direct password reset email from profile
router.post('/request-password-reset-email', authenticate, UserController.requestDirectPasswordReset);

// Account deletion & 15-day recovery grace period
router.post('/request-deletion', authenticate, UserController.requestAccountDeletion);
router.post('/cancel-deletion', authenticate, UserController.cancelAccountDeletion);

// Admin-only user governance endpoints
router.get('/', authenticate, requireAdmin, UserController.listUsers);
router.patch('/:id/ban', authenticate, requireAdmin, UserController.toggleBanUser);
router.patch('/:id/role', authenticate, requireAdmin, UserController.changeUserRole);
router.patch('/:id/profiles', authenticate, requireAdmin, UserController.adminUpdateUserProfiles);
router.delete('/:id', authenticate, requireAdmin, UserController.deleteUser);

export default router;
