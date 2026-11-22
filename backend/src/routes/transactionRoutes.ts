import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  transferFund,
  flagTransaction,
} from '../controllers/transactionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.post('/transfer', transferFund);
router.patch('/:id/flag', authorize('admin', 'staff'), flagTransaction);

export default router;
