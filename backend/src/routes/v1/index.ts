import { Router } from 'express';
import authRoutes from './auth.routes.js';
import blogRoutes from './blog.routes.js';
import activeReaderRoutes from './activeReader.routes.js';
import userRoutes from './user.routes.js';
import commentRoutes from './comment.routes.js';
import analyticsRoutes from './analytics.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

// API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'Code & Coffee Developer Journal API',
  });
});

router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);
router.use('/readers', activeReaderRoutes);
router.use('/users', userRoutes);
router.use('/comments', commentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/upload', uploadRoutes);

export default router;
