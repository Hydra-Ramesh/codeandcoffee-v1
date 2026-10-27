import { Router } from 'express';
import { UploadController, uploadMiddleware, resumeUploadMiddleware } from '../../controllers/upload.controller.js';
import { authenticate, requireAdmin, requireContributorOrAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// Authenticated users can upload profile avatars, blog banners and photos
router.post('/image', authenticate, uploadMiddleware.single('image'), UploadController.uploadImage);

// Only administrators can permanently delete images from Cloudinary storage
router.delete('/image', authenticate, requireAdmin, UploadController.deleteImage);
router.delete('/image/:publicId', authenticate, requireAdmin, UploadController.deleteImage);

// Authenticated users can upload their resume/CV for contributor applications
router.post('/resume', authenticate, resumeUploadMiddleware.single('resume'), UploadController.uploadResume);

export default router;
