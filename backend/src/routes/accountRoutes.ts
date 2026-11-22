import { Router } from 'express';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccountStatus,
  updateAccountLimits,
} from '../controllers/accountController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post('/', createAccount);
router.patch('/:id/status', authorize('admin', 'staff'), updateAccountStatus);
router.patch('/:id/limits', authorize('admin'), updateAccountLimits);

export default router;
