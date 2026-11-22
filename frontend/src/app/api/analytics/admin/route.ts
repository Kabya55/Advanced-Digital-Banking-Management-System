import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import BankAccount from '@/models/BankAccount';
import Transaction from '@/models/Transaction';
import Loan from '@/models/Loan';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    if (authUser.role !== 'admin' && authUser.role !== 'staff') {
      return forbiddenResponse();
    }

    await connectToDatabase();

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

    return NextResponse.json({
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
