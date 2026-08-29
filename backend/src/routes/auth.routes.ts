import { Router } from 'express';
import { register, login, getMe, getUsers } from '../controllers/auth.controller';
import { registerValidator, loginValidator } from '../validators/auth.validators';
import validate from '../middleware/validate';
import protect from '../middleware/auth';

const router = Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);

export default router;
