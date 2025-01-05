import { Router } from 'express';
import { healthCheckController } from '../controllers/healthcheck.controller.js';

const router = Router();

// Health check endpoint
router.route('/').get(healthCheckController);

export default router;
