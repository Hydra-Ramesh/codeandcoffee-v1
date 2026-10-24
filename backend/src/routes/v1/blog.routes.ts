import { Router } from 'express';
import { BlogController } from '../../controllers/blog.controller.js';
import { authenticate, optionalAuth, requireAdmin, requireContributorOrAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', BlogController.getAllBlogs);
router.get('/categories/summary', BlogController.getCategoriesSummary);
router.get('/:slug', authenticate, BlogController.getBlogBySlug);

// Authoring and managing blogs: Administrators and Contributors
router.post('/', authenticate, requireContributorOrAdmin, BlogController.createBlog);
router.put('/:id', authenticate, requireContributorOrAdmin, BlogController.updateBlog);
router.delete('/:id', authenticate, requireContributorOrAdmin, BlogController.deleteBlog);

// Authenticated user interaction: like and dislike
router.post('/:id/like', authenticate, BlogController.toggleLike);
router.post('/:id/dislike', authenticate, BlogController.toggleDislike);

export default router;
