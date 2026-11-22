import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import BankAccount from '@/models/BankAccount';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    if (authUser.role !== 'admin') {
      return forbiddenResponse('Only Admin can set account transaction limits');
    }

    const { id } = await params;
    const { dailyLimit, perTxnLimit } = await req.json();

    if (dailyLimit < 0 || perTxnLimit < 0) {
      return NextResponse.json(
        { error: 'Limits must be positive numbers' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const account = await BankAccount.findByIdAndUpdate(
      id,
      {
        dailyTransferLimit: Number(dailyLimit),
        perTransactionLimit: Number(perTxnLimit),
      },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
