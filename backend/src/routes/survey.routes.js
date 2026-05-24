import { Router } from 'express';
import { getMarketplaceFeedHandler } from '../controllers/survey.controller.js';
import { authMiddleware } from '../core/auth-middleware.js';

const router = Router();

// Protect all survey routes
router.use(authMiddleware);

router.get('/marketplace', getMarketplaceFeedHandler);

export default router;
