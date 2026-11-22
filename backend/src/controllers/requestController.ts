import { Response } from 'express';
import DepositWithdrawRequest from '../models/Request.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import { AuthRequest } from '../middleware/auth.js';

function generateTransactionId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${dateStr}-${randomChars}`;
}

export const getRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query;
    let filter: any = {};

    if (req.user?.role === 'customer') {
      filter.userId = req.user.userId;
    }

    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;

    const requests = await DepositWithdrawRequest.find(filter)
      .populate('userId', 'name email phone status')
      .populate('accountId', 'accountNumber accountType balance')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accountId, type, amount, description } = req.body;

    const reqAmount = Number(amount);
    if (!reqAmount || reqAmount <= 0) {
      res.status(400).json({ success: false, error: 'Amount must be greater than $0' });
      return;
    }

    if (!['deposit', 'withdrawal'].includes(type)) {
      res.status(400).json({ success: false, error: 'Type must be deposit or withdrawal' });
      return;
    }

    const account = await BankAccount.findById(accountId);
    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    if (account.userId.toString() !== req.user?.userId) {
      res.status(403).json({ success: false, error: 'You do not own this account' });
      return;
    }

    if (type === 'withdrawal' && account.balance < reqAmount) {
      res.status(400).json({
        success: false,
        error: `Insufficient balance for withdrawal. Available: $${account.balance.toFixed(2)}`,
      });
      return;
    }

    const request = await DepositWithdrawRequest.create({
      userId: req.user.userId,
      accountId,
      type,
      amount: reqAmount,
      description: description || '',
      status: 'pending',
    });

    const populated = await DepositWithdrawRequest.findById(request._id)
      .populate('userId', 'name email')
      .populate('accountId', 'accountNumber accountType');

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reviewRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      res.status(400).json({ success: false, error: 'Action must be approved or rejected' });
      return;
    }

    const request = await DepositWithdrawRequest.findById(id).populate('accountId');
    if (!request || request.status !== 'pending') {
      res.status(400).json({ success: false, error: 'Pending request not found' });
      return;
    }

    const account = request.accountId as any;

    if (action === 'approved') {
      if (request.type === 'deposit') {
        // Atomic credit
        await BankAccount.findByIdAndUpdate(account._id, {
          $inc: { balance: request.amount },
        });

        const txnId = generateTransactionId();
        await Transaction.create({
          transactionId: txnId,
          type: 'deposit',
          receiverAccountId: account._id,
          receiverAccountNum: account.accountNumber,
          amount: request.amount,
          fee: 0,
          status: 'completed',
          description: request.description || 'Approved Cash Deposit',
        });
      } else if (request.type === 'withdrawal') {
        // Atomic debit with balance check
        const updated = await BankAccount.findOneAndUpdate(
          { _id: account._id, balance: { $gte: request.amount } },
          { $inc: { balance: -request.amount } },
          { new: true }
        );

        if (!updated) {
          res.status(400).json({
            success: false,
            error: 'Account has insufficient funds for this withdrawal',
          });
          return;
        }

        const txnId = generateTransactionId();
        await Transaction.create({
          transactionId: txnId,
          type: 'withdrawal',
          senderAccountId: account._id,
          senderAccountNum: account.accountNumber,
          amount: request.amount,
          fee: 0,
          status: 'completed',
          description: request.description || 'Approved Cash Withdrawal',
        });
      }
    }

    request.status = action;
    request.reviewedBy = req.user?.userId as any;
    request.reviewNotes = reviewNotes || `${req.user?.name} (${req.user?.role}): ${action}`;
    await request.save();

    const populated = await DepositWithdrawRequest.findById(id)
      .populate('userId', 'name email')
      .populate('accountId', 'accountNumber accountType')
      .populate('reviewedBy', 'name role');

    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
