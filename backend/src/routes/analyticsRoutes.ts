import { Router } from 'express';
import {
  getAdminAnalytics,
  getCustomerAnalytics,
} from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/admin', authorize('admin', 'staff'), getAdminAnalytics);
router.get('/customer', getCustomerAnalytics);

export default router;
