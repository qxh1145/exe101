import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../core/validate-request.js';
import { authMiddleware } from '../core/auth-middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
