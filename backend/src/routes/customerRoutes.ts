import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  registerCustomerByStaff,
} from '../controllers/customerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'staff'));

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.patch('/:id/status', authorize('admin'), updateCustomerStatus);
router.post('/staff-register', registerCustomerByStaff);

export default router;
