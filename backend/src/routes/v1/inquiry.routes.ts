import { Router } from 'express';
import { InquiryController } from '../../controllers/inquiry.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { honeypotCheck } from '../../middleware/honeypot.middleware.js';
import { inquiryLimiter } from '../../middleware/rateLimiter.middleware.js';

const router = Router();

// Public: Submit a contact inquiry (rate limited to 5/15min)
router.post('/', inquiryLimiter, honeypotCheck, InquiryController.submitInquiry);

// Admin-only: List all inquiries
router.get('/', authenticate, requireAdmin, InquiryController.getInquiries);

// Admin-only: Get pending inquiries count for badge
router.get('/pending-count', authenticate, requireAdmin, InquiryController.getPendingCount);

// Admin-only: Get single inquiry detail
router.get('/:id', authenticate, requireAdmin, InquiryController.getInquiryById);

// Admin-only: Resolve inquiry with custom response body (dispatches email to user)
router.patch('/:id/resolve', authenticate, requireAdmin, InquiryController.resolveInquiry);

// Admin-only: Delete an inquiry
router.delete('/:id', authenticate, requireAdmin, InquiryController.deleteInquiry);

export default router;
