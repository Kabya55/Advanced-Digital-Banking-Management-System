import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import BankAccount from '@/models/BankAccount';
import Transaction from '@/models/Transaction';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const userAccounts = await BankAccount.find({ userId: authUser.userId }).select('_id');
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

    return NextResponse.json({
      monthlySpending,
      monthlyDepositHistory,
      transactionDistribution,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
