import { Router } from 'express';
import {
  getAllCourses,
  getCourseBySlug,
  getSubtopicDetail,
  submitQuiz,
  markLessonComplete,
  createCourse,
  updateCourse,
  deleteCourse,
  createTopic,
  updateTopic,
  deleteTopic,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
  getCourseTelemetry,
} from '../../controllers/course.controller.js';
import {
  authenticate,
  optionalAuth,
  requireContributorOrAdmin,
} from '../../middleware/auth.middleware.js';

const router = Router();

// ==============================================================================
// PUBLIC & READER ROUTES
// ==============================================================================

// List all courses (supports ?category= & ?search=)
router.get('/', optionalAuth, getAllCourses);

// Get single course syllabus with lock progression status
router.get('/:slug', optionalAuth, getCourseBySlug);

// Get individual subtopic/lesson content (Readme, screenshots, practice question, quiz)
router.get('/:courseSlug/topics/:topicSlug/subtopics/:subtopicSlug', optionalAuth, getSubtopicDetail);
router.get('/:courseSlug/subtopics/:topicSlug/:subtopicSlug', optionalAuth, getSubtopicDetail);

// Submit interactive quiz (Score >= 25% unlocks next topic/section)
router.post('/:courseSlug/subtopics/:subtopicId/quiz/submit', authenticate, submitQuiz);

// Mark lesson complete (for lessons without quizzes, or already passed)
router.post('/:courseSlug/subtopics/:subtopicId/complete', authenticate, markLessonComplete);

// ==============================================================================
// ADMIN & CONTRIBUTOR AUTHORING & TELEMETRY ROUTES
// ==============================================================================

// Create new course
router.post('/', authenticate, requireContributorOrAdmin, createCourse);

// Update course metadata
router.put('/:id', authenticate, requireContributorOrAdmin, updateCourse);

// Delete course
router.delete('/:id', authenticate, requireContributorOrAdmin, deleteCourse);

// Add topic to course
router.post('/:courseId/topics', authenticate, requireContributorOrAdmin, createTopic);

// Update topic
router.put('/topics/:topicId', authenticate, requireContributorOrAdmin, updateTopic);

// Delete topic
router.delete('/topics/:topicId', authenticate, requireContributorOrAdmin, deleteTopic);

// Add subtopic (lesson) to topic
router.post('/topics/:topicId/subtopics', authenticate, requireContributorOrAdmin, createSubtopic);
router.post('/:topicId/subtopics', authenticate, requireContributorOrAdmin, createSubtopic);

// Update subtopic
router.put('/subtopics/:subtopicId', authenticate, requireContributorOrAdmin, updateSubtopic);

// Delete subtopic
router.delete('/subtopics/:subtopicId', authenticate, requireContributorOrAdmin, deleteSubtopic);

// Student progress monitoring & quiz telemetry
router.get('/admin/telemetry/:courseId', authenticate, requireContributorOrAdmin, getCourseTelemetry);
router.get('/:courseId/telemetry', authenticate, requireContributorOrAdmin, getCourseTelemetry);

export default router;
