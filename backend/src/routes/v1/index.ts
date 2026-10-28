import { Router } from 'express';
import authRoutes from './auth.routes.js';
import blogRoutes from './blog.routes.js';
import activeReaderRoutes from './activeReader.routes.js';
import userRoutes from './user.routes.js';
import commentRoutes from './comment.routes.js';
import analyticsRoutes from './analytics.routes.js';
import uploadRoutes from './upload.routes.js';
import contributorRoutes from './contributor.routes.js';
import inquiryRoutes from './inquiry.routes.js';
import waitlistRoutes from './waitlist.routes.js';
import practiceRoutes from './practice.routes.js';
import courseRoutes from './course.routes.js';
import notificationRoutes from './notification.routes.js';
import healthRoutes from './health.routes.js';
import metricsRoutes from './metrics.routes.js';

const router = Router();

// Health Check Routes (shallow and deep)
router.use('/health', healthRoutes);

// Prometheus OpenMetrics Scrape Endpoint
router.use('/metrics', metricsRoutes);

router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);
router.use('/readers', activeReaderRoutes);
router.use('/users', userRoutes);
router.use('/comments', commentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/upload', uploadRoutes);
router.use('/contributors', contributorRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/waitlist', waitlistRoutes);
router.use('/practice', practiceRoutes);
router.use('/courses', courseRoutes);
router.use('/notifications', notificationRoutes);

export default router;
