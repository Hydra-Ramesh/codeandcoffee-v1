import { Router } from 'express';
import { ActiveReaderController } from '../../controllers/activeReader.controller.js';
import { heartbeatLimiter } from '../../middleware/rateLimiter.middleware.js';

const router = Router();

// Heartbeat ping from blog reader
router.post('/heartbeat', heartbeatLimiter, ActiveReaderController.heartbeat);

// Global active reader statistics
router.get('/stats/global', ActiveReaderController.getGlobalStats);

// Get active count for specific blog
router.get('/:blogId', ActiveReaderController.getActiveCount);

export default router;
