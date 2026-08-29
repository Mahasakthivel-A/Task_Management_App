import { Router } from 'express';
import { getComments, addComment, deleteComment } from '../controllers/comment.controller';
import { commentValidator } from '../validators/comment.validators';
import validate from '../middleware/validate';
import protect from '../middleware/auth';

const router = Router({ mergeParams: true }); // mergeParams to access taskId

router.use(protect);

router.get('/', getComments);
router.post('/', commentValidator, validate, addComment);
router.delete('/:commentId', deleteComment);

export default router;
