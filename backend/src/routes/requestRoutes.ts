import { Router } from 'express';
import {
  getRequests,
  createRequest,
  reviewRequest,
} from '../controllers/requestController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getRequests);
router.post('/', createRequest);
router.patch('/:id/review', authorize('admin', 'staff'), reviewRequest);

export default router;
