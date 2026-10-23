import { Router } from 'express';
import { ContributorController } from '../../controllers/contributor.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// Authenticated user: Apply to become a contributor
router.post('/apply', authenticate, ContributorController.applyForContributor);

// Authenticated user: View own application status
router.get('/my-application', authenticate, ContributorController.getMyApplication);

// Admin-only: List all contributor applications
router.get('/applications', authenticate, requireAdmin, ContributorController.listApplications);

// Admin-only: Get pending applications count for notification badge
router.get('/pending-count', authenticate, requireAdmin, ContributorController.getPendingCount);

// Admin-only: Approve or Reject application (promotes user to CONTRIBUTOR)
router.patch('/applications/:id/status', authenticate, requireAdmin, ContributorController.updateApplicationStatus);

export default router;
