import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import surveyRoutes from './survey.routes.js';

const router = Router();

// Mount all v1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/surveys', surveyRoutes);

export default router;
