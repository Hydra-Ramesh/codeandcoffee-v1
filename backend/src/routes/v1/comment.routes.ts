import { Router } from 'express';
import { CommentController } from '../../controllers/comment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/:postId', CommentController.getComments);
router.post('/', authenticate, CommentController.addComment);
router.delete('/:id', authenticate, CommentController.deleteComment);

export default router;
