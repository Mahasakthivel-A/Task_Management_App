import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';
import {
  createTaskValidator,
  updateTaskValidator,
  taskQueryValidator,
} from '../validators/task.validators';
import validate from '../middleware/validate';
import protect from '../middleware/auth';

const router = Router();

router.use(protect); // All task routes require authentication

router.get('/', taskQueryValidator, validate, getTasks);
router.post('/', createTaskValidator, validate, createTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTaskValidator, validate, updateTask);
router.delete('/:id', deleteTask);

export default router;
