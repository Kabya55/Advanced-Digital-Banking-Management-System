import { Response } from 'express';
import BankAccount from '../models/BankAccount.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.query.userId as string;
    let filter: any = {};

    if (req.user?.role === 'customer') {
      filter.userId = req.user.userId;
    } else {
      if (targetUserId) {
        filter.userId = targetUserId;
      }
    }

    const accounts = await BankAccount.find(filter)
      .populate('userId', 'name email phone status isBlocked')
      .sort({ createdAt: -1 });

    res.json(accounts);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAccountById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const account = await BankAccount.findById(req.params.id).populate(
      'userId',
      'name email phone status isBlocked'
    );

    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    if (
      req.user?.role === 'customer' &&
      account.userId._id.toString() !== req.user.userId
    ) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.json(account);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accountType = 'Savings', initialDeposit = 0, currency = 'USD', userId } = req.body;

    let targetUserId = req.user?.userId;
    if (userId && (req.user?.role === 'admin' || req.user?.role === 'staff')) {
      targetUserId = userId;
    }

    const customer = await User.findById(targetUserId);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    let accountNumber = '';
    let exists = true;
    while (exists) {
      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
      accountNumber = `10${randomSuffix}`;
      const found = await BankAccount.findOne({ accountNumber });
      if (!found) exists = false;
    }

    const newAccount = await BankAccount.create({
      accountNumber,
      userId: targetUserId,
      accountType,
      balance: Math.max(0, Number(initialDeposit)),
      currency,
      status: 'active',
      dailyTransferLimit: 50000,
      perTransactionLimit: 20000,
    });

    const populated = await BankAccount.findById(newAccount._id).populate(
      'userId',
      'name email phone'
    );

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAccountStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['active', 'frozen', 'closed'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid account status' });
      return;
    }

    const account = await BankAccount.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    res.json(account);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAccountLimits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dailyLimit, perTxnLimit } = req.body;

    if (dailyLimit < 0 || perTxnLimit < 0) {
      res.status(400).json({ success: false, error: 'Limits must be non-negative numbers' });
      return;
    }

    const account = await BankAccount.findByIdAndUpdate(
      req.params.id,
      {
        dailyTransferLimit: Number(dailyLimit),
        perTransactionLimit: Number(perTxnLimit),
      },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    res.json(account);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
