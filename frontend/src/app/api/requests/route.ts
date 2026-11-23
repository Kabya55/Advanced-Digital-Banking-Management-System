import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import DepositWithdrawRequest from '@/models/Request';
import BankAccount from '@/models/BankAccount';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let filter: any = {};

    if (authUser.role === 'customer') {
      filter.userId = authUser.userId;
    }

    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;

    const requests = await DepositWithdrawRequest.find(filter)
      .populate('userId', 'name email phone status')
      .populate('accountId', 'accountNumber accountType balance')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const { accountId, type, amount, description } = await req.json();

    const reqAmount = Number(amount);
    if (!reqAmount || reqAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than $0' }, { status: 400 });
    }

    if (!['deposit', 'withdrawal'].includes(type)) {
      return NextResponse.json({ error: 'Type must be deposit or withdrawal' }, { status: 400 });
    }

    await connectToDatabase();

    const account = await BankAccount.findById(accountId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (account.userId.toString() !== authUser.userId) {
      return NextResponse.json({ error: 'You do not own this account' }, { status: 403 });
    }

    if (account.status !== 'active') {
      return NextResponse.json(
        {
          error:
            account.status === 'pending'
              ? 'Account is pending approval. Deposit and withdrawal requests are locked until approved.'
              : `Account is ${account.status}. Requests cannot be processed.`,
        },
        { status: 400 }
      );
    }

    if (type === 'withdrawal' && account.balance < reqAmount) {
      return NextResponse.json(
        {
          error: `Insufficient balance for withdrawal. Available: $${account.balance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    const request = await DepositWithdrawRequest.create({
      userId: authUser.userId,
      accountId,
      type,
      amount: reqAmount,
      description: description || '',
      status: 'pending',
    });

    const populated = await DepositWithdrawRequest.findById(request._id)
      .populate('userId', 'name email')
      .populate('accountId', 'accountNumber accountType');

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
