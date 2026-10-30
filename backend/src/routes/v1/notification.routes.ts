import { Router } from 'express';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../controllers/notification.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getUserNotifications);
router.patch('/read-all', authenticate, markAllNotificationsRead);
router.put('/read-all', authenticate, markAllNotificationsRead);
router.patch('/:id/read', authenticate, markNotificationRead);
router.put('/:id/read', authenticate, markNotificationRead);

export default router;
