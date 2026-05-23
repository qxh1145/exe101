import { Router } from 'express';
import { updateProfileHandler } from '../controllers/user.controller.js';
import { authMiddleware } from '../core/auth-middleware.js';
import { validateRequest } from '../core/validate-request.js';
import { updateProfileSchema } from '../validators/profile.validator.js';

const router = Router();

// Protect all user routes
router.use(authMiddleware);

router.put('/profile', validateRequest(updateProfileSchema), updateProfileHandler);

export default router;
