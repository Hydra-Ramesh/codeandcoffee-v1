import { Router } from 'express';
import { UploadController, uploadMiddleware } from '../../controllers/upload.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// Only admin can upload blog banners and images
router.post('/image', authenticate, requireAdmin, uploadMiddleware.single('image'), UploadController.uploadImage);
router.delete('/image', authenticate, requireAdmin, UploadController.deleteImage);
router.delete('/image/:publicId', authenticate, requireAdmin, UploadController.deleteImage);

export default router;
