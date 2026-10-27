import { Router } from 'express';
import { PracticeController } from '../../controllers/practice.controller.js';
import {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireContributorOrAdmin,
} from '../../middleware/auth.middleware.js';

const router = Router();

// ==========================================
// PUBLIC & USER PROGRESS ROUTES
// ==========================================

// Get questions for a sheet with user's progress if logged in
router.get('/sheet/:sheetType', optionalAuth, PracticeController.getSheetQuestions);

// Get single question detail
router.get('/question/:id', optionalAuth, PracticeController.getQuestionById);

// Public Practice Leaderboard (Points & Streaks)
router.get('/leaderboard', optionalAuth, PracticeController.getPublicLeaderboard);

// Personal detailed streak stats for logged-in user
router.get('/my-streak', authenticate, PracticeController.getMyStreak);

// Get overall progress summary for authenticated user
router.get('/my-progress', authenticate, PracticeController.getMyOverallProgress);

// Toggle completion checkmark for a question
router.post('/my-progress/:questionId/toggle', authenticate, PracticeController.toggleProgress);

// Save or update personal revision note
router.put('/my-progress/:questionId/note', authenticate, PracticeController.saveQuestionNote);

// ==========================================
// ADMIN & CONTRIBUTOR MANAGEMENT ROUTES
// ==========================================

// List all questions with filters
router.get('/admin/all', authenticate, requireContributorOrAdmin, PracticeController.adminGetAllQuestions);

// Get real-time user activity and practice metrics (ADMIN ONLY - contributors cannot view user data or activity)
router.get('/admin/activity', authenticate, requireAdmin, PracticeController.adminGetUserActivity);

// Create new question
router.post('/admin/question', authenticate, requireContributorOrAdmin, PracticeController.adminCreateQuestion);

// Update existing question
router.put('/admin/question/:id', authenticate, requireContributorOrAdmin, PracticeController.adminUpdateQuestion);

// Delete question
router.delete('/admin/question/:id', authenticate, requireContributorOrAdmin, PracticeController.adminDeleteQuestion);

export default router;
