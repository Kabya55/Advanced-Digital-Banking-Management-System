import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import BankAccount from '@/models/BankAccount';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const flagged = searchParams.get('flagged');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    let query: any = {};

    if (authUser.role === 'customer') {
      const userAccounts = await BankAccount.find({ userId: authUser.userId }).select('_id');
      const userAccountIds = userAccounts.map((a) => a._id);

      query.$or = [
        { senderAccountId: { $in: userAccountIds } },
        { receiverAccountId: { $in: userAccountIds } },
      ];
    }

    if (accountId) {
      if (authUser.role === 'customer') {
        query.$and = [
          {
            $or: [{ senderAccountId: accountId }, { receiverAccountId: accountId }],
          },
        ];
      } else {
        query.$or = [{ senderAccountId: accountId }, { receiverAccountId: accountId }];
      }
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (flagged === 'true') {
      query.flaggedForReview = true;
    }

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
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('senderAccountId', 'accountNumber accountType userId')
        .populate('receiverAccountId', 'accountNumber accountType userId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query),
    ]);

    return NextResponse.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
