import { Router } from 'express';
import {
  getLoans,
  getLoanById,
  applyLoan,
  reviewLoan,
  repayLoanInstallment,
} from '../controllers/loanController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getLoans);
router.get('/:id', getLoanById);
router.post('/', applyLoan);
router.patch('/:id/review', authorize('admin', 'staff'), reviewLoan);
router.post('/repay', repayLoanInstallment);

export default router;
