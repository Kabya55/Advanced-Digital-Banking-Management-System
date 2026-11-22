import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import BankAccount from '@/models/BankAccount';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    let filter: any = {};

    if (authUser.role === 'customer') {
      filter.userId = authUser.userId;
    } else {
      if (targetUserId) {
        filter.userId = targetUserId;
      }
    }

    const accounts = await BankAccount.find(filter)
      .populate('userId', 'name email phone status isBlocked')
      .sort({ createdAt: -1 });

    return NextResponse.json(accounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const body = await req.json();
    const { accountType, initialDeposit = 0, currency = 'USD', userId } = body;

    await connectToDatabase();

    let targetUserId = authUser.userId;

    if (userId && (authUser.role === 'admin' || authUser.role === 'staff')) {
      targetUserId = userId;
    }

    const customer = await User.findById(targetUserId);
    if (!customer) {
      return NextResponse.json({ error: 'Target customer not found' }, { status: 404 });
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
      accountType: accountType || 'Savings',
      balance: Math.max(0, Number(initialDeposit)),
      currency: currency || 'USD',
      status: 'active',
      dailyTransferLimit: 50000,
      perTransactionLimit: 20000,
    });

    const populated = await BankAccount.findById(newAccount._id).populate(
      'userId',
      'name email phone'
    );

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
