import { Response } from 'express';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import Loan from '../models/Loan.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAdminAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalCustomers,
      totalAccounts,
      accountsAggregate,
      transactionsAggregate,
      pendingLoansCount,
      transactions,
      loans,
      accountTypesCount,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      BankAccount.countDocuments(),
      BankAccount.aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: '$balance' },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Loan.countDocuments({ status: 'pending' }),
      Transaction.find().sort({ createdAt: -1 }).limit(500),
      Loan.find(),
      BankAccount.aggregate([
        {
          $group: {
            _id: '$accountType',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalBankBalance = accountsAggregate[0]?.totalBalance || 0;

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalTransactions = 0;

    transactionsAggregate.forEach((item) => {
      totalTransactions += item.count;
      if (item._id === 'deposit' || item._id === 'loan_disbursement') {
        totalDeposits += item.totalAmount;
      }
      if (item._id === 'withdrawal' || item._id === 'loan_repayment') {
        totalWithdrawals += item.totalAmount;
      }
    });

    // Monthly volume calculation (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyVolumeMap: { [key: string]: { deposits: number; withdrawals: number; transfers: number } } = {};

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      monthlyVolumeMap[mName] = { deposits: 0, withdrawals: 0, transfers: 0 };
    }

    transactions.forEach((txn) => {
      const txnMonth = months[new Date(txn.createdAt).getMonth()];
      if (monthlyVolumeMap[txnMonth]) {
        if (txn.type === 'deposit') monthlyVolumeMap[txnMonth].deposits += txn.amount;
        else if (txn.type === 'withdrawal') monthlyVolumeMap[txnMonth].withdrawals += txn.amount;
        else if (txn.type === 'fund_transfer') monthlyVolumeMap[txnMonth].transfers += txn.amount;
      }
    });

    const monthlyVolume = Object.keys(monthlyVolumeMap).map((month) => ({
      month,
      deposits: Number(monthlyVolumeMap[month].deposits.toFixed(2)),
      withdrawals: Number(monthlyVolumeMap[month].withdrawals.toFixed(2)),
      transfers: Number(monthlyVolumeMap[month].transfers.toFixed(2)),
    }));

    const accountDistribution = accountTypesCount.map((item) => ({
      name: item._id || 'Savings',
      value: item.count,
    }));

    const loanStatsMap: { [key: string]: number } = {
      pending: 0,
      under_review: 0,
      approved: 0,
      active: 0,
      completed: 0,
      rejected: 0,
    };
    loans.forEach((l) => {
      if (loanStatsMap[l.status] !== undefined) loanStatsMap[l.status]++;
    });

    const loanStatistics = Object.keys(loanStatsMap).map((status) => ({
      status: status.replace('_', ' ').toUpperCase(),
      count: loanStatsMap[status],
    }));

    res.json({
      totalCustomers,
      totalAccounts,
      totalBankBalance,
      totalDeposits,
      totalWithdrawals,
      totalTransactions,
      pendingLoans: pendingLoansCount,
      monthlyVolume,
      accountDistribution,
      loanStatistics,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userAccounts = await BankAccount.find({ userId: req.user?.userId }).select('_id');
    const accountIds = userAccounts.map((a) => a._id);

    const transactions = await Transaction.find({
      $or: [{ senderAccountId: { $in: accountIds } }, { receiverAccountId: { $in: accountIds } }],
    }).sort({ createdAt: -1 });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const spendingMap: { [key: string]: number } = {};
    const depositMap: { [key: string]: number } = {};
    const typeDistribution: { [key: string]: number } = {};

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      spendingMap[mName] = 0;
      depositMap[mName] = 0;
    }

    transactions.forEach((txn) => {
      const mName = months[new Date(txn.createdAt).getMonth()];
      const isSender = txn.senderAccountId && accountIds.some((id) => id.equals(txn.senderAccountId as any));
      const isReceiver = txn.receiverAccountId && accountIds.some((id) => id.equals(txn.receiverAccountId as any));

      if (isSender && spendingMap[mName] !== undefined) {
        spendingMap[mName] += txn.amount;
      }
      if (isReceiver && depositMap[mName] !== undefined) {
        depositMap[mName] += txn.amount;
      }

      typeDistribution[txn.type] = (typeDistribution[txn.type] || 0) + 1;
    });

    const monthlySpending = Object.keys(spendingMap).map((month) => ({
      month,
      amount: Number(spendingMap[month].toFixed(2)),
    }));

    const monthlyDepositHistory = Object.keys(depositMap).map((month) => ({
      month,
      amount: Number(depositMap[month].toFixed(2)),
    }));

    const transactionDistribution = Object.keys(typeDistribution).map((type) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: typeDistribution[type],
    }));

    res.json({
      monthlySpending,
      monthlyDepositHistory,
      transactionDistribution,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
