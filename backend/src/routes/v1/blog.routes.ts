import { Router } from 'express';
import { BlogController } from '../../controllers/blog.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', BlogController.getAllBlogs);
router.get('/:slug', optionalAuth, BlogController.getBlogBySlug);

// Admin-only routes for authoring and managing blogs
router.post('/', authenticate, requireAdmin, BlogController.createBlog);
router.put('/:id', authenticate, requireAdmin, BlogController.updateBlog);
router.delete('/:id', authenticate, requireAdmin, BlogController.deleteBlog);

// Authenticated user interaction: like and dislike
router.post('/:id/like', authenticate, BlogController.toggleLike);
router.post('/:id/dislike', authenticate, BlogController.toggleDislike);

export default router;
