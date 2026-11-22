import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import BankAccount from '@/models/BankAccount';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const { id } = await params;
    await connectToDatabase();

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
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (authUser.role === 'customer') {
      const userAccounts = await BankAccount.find({ userId: authUser.userId }).select('_id');
      const userAccountIds = userAccounts.map((a) => a._id.toString());

      const senderId = (transaction.senderAccountId as any)?._id?.toString() || '';
      const receiverId = (transaction.receiverAccountId as any)?._id?.toString() || '';

      const isSender = senderId && userAccountIds.includes(senderId);
      const isReceiver = receiverId && userAccountIds.includes(receiverId);

      if (!isSender && !isReceiver) {
        return forbiddenResponse();
      }
    }

    return NextResponse.json(transaction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
