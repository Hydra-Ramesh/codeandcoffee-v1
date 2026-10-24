import { Router } from 'express';
import { WaitlistController } from '../../controllers/waitlist.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { honeypotCheck } from '../../middleware/honeypot.middleware.js';

const router = Router();

// Authenticated user: Join the early access waitlist
router.post('/join', authenticate, honeypotCheck, WaitlistController.joinWaitlist);

// Authenticated user: Get current user's waitlist registration status
router.get('/my-status', authenticate, WaitlistController.getMyStatus);

// Admin-only: Full waitlist overview with search, filters, pagination
router.get('/admin', authenticate, requireAdmin, WaitlistController.getWaitlistAdmin);

// Admin-only: Waitlist statistics & badge counts
router.get('/stats', authenticate, requireAdmin, WaitlistController.getWaitlistStats);

// Admin-only: Update waitlist entry status (WAITLISTED | INVITED | ONBOARDED)
router.patch('/:id/status', authenticate, requireAdmin, WaitlistController.updateStatusAdmin);

// Admin-only: Delete waitlist entry
router.delete('/:id', authenticate, requireAdmin, WaitlistController.deleteEntryAdmin);

export default router;
