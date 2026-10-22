import { Router } from 'express';
import { AnalyticsController } from '../../controllers/analytics.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/dashboard', authenticate, requireAdmin, AnalyticsController.getDashboardOverview);

export default router;
