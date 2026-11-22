import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import BankAccount from '@/models/BankAccount';
import Transaction from '@/models/Transaction';
import Loan from '@/models/Loan';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    if (authUser.role !== 'admin' && authUser.role !== 'staff') {
      return forbiddenResponse();
    }

    const { id } = await params;
    await connectToDatabase();

    const customer = await User.findById(id).select('-password');
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const accounts = await BankAccount.find({ userId: customer._id });
    const accountIds = accounts.map((a) => a._id);

    const [loans, transactions] = await Promise.all([
      Loan.find({ userId: customer._id }).sort({ createdAt: -1 }),
      Transaction.find({
        $or: [{ senderAccountId: { $in: accountIds } }, { receiverAccountId: { $in: accountIds } }],
      })
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    return NextResponse.json({
      customer,
      accounts,
      loans,
      transactions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
