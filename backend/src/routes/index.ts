import { Router } from 'express';
import authRoutes from './authRoutes.js';
import accountRoutes from './accountRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import loanRoutes from './loanRoutes.js';
import requestRoutes from './requestRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import customerRoutes from './customerRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/loans', loanRoutes);
router.use('/requests', requestRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/customers', customerRoutes);

export default router;
