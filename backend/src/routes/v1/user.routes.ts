import { Router } from 'express';
import { UserController } from '../../controllers/user.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// User self-profile endpoints
router.get('/profile', authenticate, UserController.getProfile);
router.put('/profile', authenticate, UserController.updateProfile);

// Admin-only user governance endpoints
router.get('/', authenticate, requireAdmin, UserController.listUsers);
router.patch('/:id/ban', authenticate, requireAdmin, UserController.toggleBanUser);
router.patch('/:id/role', authenticate, requireAdmin, UserController.changeUserRole);
router.delete('/:id', authenticate, requireAdmin, UserController.deleteUser);

export default router;
