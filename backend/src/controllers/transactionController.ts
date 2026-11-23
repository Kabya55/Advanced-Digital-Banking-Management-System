import { Response } from 'express';
import bcrypt from 'bcryptjs';
import Transaction from '../models/Transaction.js';
import BankAccount from '../models/BankAccount.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

function generateTransactionId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${dateStr}-${randomChars}`;
}

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      accountId,
      type,
      status,
      search,
      startDate,
      endDate,
      flagged,
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    let query: any = {};

    if (req.user?.role === 'customer') {
      const userAccounts = await BankAccount.find({ userId: req.user.userId }).select('_id');
      const userAccountIds = userAccounts.map((a) => a._id);

      query.$or = [
        { senderAccountId: { $in: userAccountIds } },
        { receiverAccountId: { $in: userAccountIds } },
      ];
    }

    if (accountId) {
      if (req.user?.role === 'customer') {
        query.$and = [
          {
            $or: [{ senderAccountId: accountId }, { receiverAccountId: accountId }],
          },
        ];
      } else {
        query.$or = [{ senderAccountId: accountId }, { receiverAccountId: accountId }];
      }
    }

    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    if (flagged === 'true') query.flaggedForReview = true;

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { senderAccountNum: { $regex: search, $options: 'i' } },
        { receiverAccountNum: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('senderAccountId', 'accountNumber accountType userId')
        .populate('receiverAccountId', 'accountNumber accountType userId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.json({
      transactions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { transactionId: id }],
    })
      .populate({
        path: 'senderAccountId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate({
        path: 'receiverAccountId',
        populate: { path: 'userId', select: 'name email phone' },
      });

    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    if (req.user?.role === 'customer') {
      const userAccounts = await BankAccount.find({ userId: req.user.userId }).select('_id');
      const userAccountIds = userAccounts.map((a) => a._id.toString());
      const senderId = (transaction.senderAccountId as any)?._id?.toString() || '';
      const receiverId = (transaction.receiverAccountId as any)?._id?.toString() || '';

      const isSender = senderId && userAccountIds.includes(senderId);
      const isReceiver = receiverId && userAccountIds.includes(receiverId);

      if (!isSender && !isReceiver) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
    }

    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const transferFund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { senderAccountId, receiverAccountNumber, amount, description, pin } = req.body;

    const transferAmount = Number(amount);
    if (!transferAmount || transferAmount <= 0 || isNaN(transferAmount)) {
      res.status(400).json({ success: false, error: 'Enter a valid transfer amount greater than $0' });
      return;
    }

    if (!pin) {
      res.status(400).json({ success: false, error: 'Transaction PIN is required' });
      return;
    }

    // 1. PIN verification
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    if (user.status === 'pending') {
      res.status(403).json({
        success: false,
        error: 'Your account is pending verification and approval by bank administration. All transfers are restricted until approved.',
      });
      return;
    }

    if (!user.transactionPin) {
      res.status(400).json({
        success: false,
        error: 'Please set up a Transaction PIN in your Profile settings before transferring funds.',
      });
      return;
    }

    const isPinValid = await bcrypt.compare(pin, user.transactionPin);
    if (!isPinValid) {
      res.status(400).json({ success: false, error: 'Incorrect Transaction PIN' });
      return;
    }

    // 2. Sender Account checks
    const senderAccount = await BankAccount.findById(senderAccountId);
    if (!senderAccount) {
      res.status(404).json({ success: false, error: 'Sender account not found' });
      return;
    }

    if (
      req.user?.role === 'customer' &&
      senderAccount.userId.toString() !== req.user.userId
    ) {
      res.status(403).json({ success: false, error: 'You do not own this account' });
      return;
    }

    if (senderAccount.status !== 'active') {
      res.status(400).json({
        success: false,
        error:
          senderAccount.status === 'pending'
            ? 'This bank account is pending approval by bank administration. Transfers cannot be executed until approved.'
            : `Sender account is ${senderAccount.status}. Transfers are disabled.`,
      });
      return;
    }

    if (transferAmount > senderAccount.perTransactionLimit) {
      res.status(400).json({
        success: false,
        error: `Amount exceeds the per-transaction limit of $${senderAccount.perTransactionLimit.toLocaleString()}`,
      });
      return;
    }

    if (senderAccount.balance < transferAmount) {
      res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: $${senderAccount.balance.toFixed(
          2
        )}, Requested: $${transferAmount.toFixed(2)}`,
      });
      return;
    }

    // 3. Recipient Account checks
    const cleanReceiverNum = receiverAccountNumber.trim();
    if (senderAccount.accountNumber === cleanReceiverNum) {
      res.status(400).json({ success: false, error: 'Cannot transfer to the same account' });
      return;
    }

    const receiverAccount = await BankAccount.findOne({ accountNumber: cleanReceiverNum });
    if (!receiverAccount) {
      res.status(404).json({
        success: false,
        error: `Destination account "${cleanReceiverNum}" does not exist.`,
      });
      return;
    }

    if (receiverAccount.status !== 'active') {
      res.status(400).json({
        success: false,
        error: `Recipient account is ${receiverAccount.status}. Transfer cannot proceed.`,
      });
      return;
    }

    // 4. ATOMIC OPERATION WITH RACE-CONDITION SAFE BALANCE DECREMENT
    const updatedSender = await BankAccount.findOneAndUpdate(
      {
        _id: senderAccountId,
        balance: { $gte: transferAmount },
        status: 'active',
      },
      {
        $inc: { balance: -transferAmount },
      },
      { new: true }
    );

    if (!updatedSender) {
      res.status(400).json({
        success: false,
        error: 'Transfer failed: Insufficient balance or concurrent modification.',
      });
      return;
    }

    // Credit receiver
    const updatedReceiver = await BankAccount.findByIdAndUpdate(
      receiverAccount._id,
      {
        $inc: { balance: transferAmount },
      },
      { new: true }
    );

    if (!updatedReceiver) {
      // Revert sender
      await BankAccount.findByIdAndUpdate(senderAccountId, {
        $inc: { balance: transferAmount },
      });
      res.status(500).json({ success: false, error: 'Transfer failed during credit. Rolled back.' });
      return;
    }

    // 5. Create transaction record
    const transactionId = generateTransactionId();
    const transaction = await Transaction.create({
      transactionId,
      type: 'fund_transfer',
      senderAccountId: senderAccount._id,
      receiverAccountId: receiverAccount._id,
      senderAccountNum: senderAccount.accountNumber,
      receiverAccountNum: receiverAccount.accountNumber,
      amount: transferAmount,
      fee: 0,
      status: 'completed',
      description: description?.trim() || `Transfer to ${receiverAccount.accountNumber}`,
    });

    const populatedTxn = await Transaction.findById(transaction._id)
      .populate('senderAccountId', 'accountNumber accountType')
      .populate('receiverAccountId', 'accountNumber accountType');

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      transaction: populatedTxn,
      newBalance: updatedSender.balance,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const flagTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { flagReason } = req.body;

    if (!flagReason || flagReason.trim() === '') {
      res.status(400).json({ success: false, error: 'Reason is required to flag a transaction' });
      return;
    }

    const transaction = await Transaction.findOneAndUpdate(
      {
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { transactionId: id }],
      },
      {
        flaggedForReview: true,
        flagReason: `${req.user?.name} (${req.user?.role}): ${flagReason.trim()}`,
      },
      { new: true }
    );

    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
