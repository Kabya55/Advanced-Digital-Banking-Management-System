import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import DepositWithdrawRequest from '@/models/Request';
import BankAccount from '@/models/BankAccount';
import Transaction from '@/models/Transaction';

function generateTransactionId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${dateStr}-${randomChars}`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    if (authUser.role !== 'staff' && authUser.role !== 'admin') {
      return forbiddenResponse('Only Staff and Admin can review cashier requests');
    }

    const { id } = await params;
    const { action, reviewNotes } = await req.json();

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Action must be approved or rejected' }, { status: 400 });
    }

    await connectToDatabase();

    const request = await DepositWithdrawRequest.findById(id).populate('accountId');
    if (!request || request.status !== 'pending') {
      return NextResponse.json({ error: 'Pending request not found' }, { status: 400 });
    }

    const account = request.accountId as any;

    if (action === 'approved') {
      if (request.type === 'deposit') {
        await BankAccount.findByIdAndUpdate(account._id, {
          $inc: { balance: request.amount },
        });

        const txnId = generateTransactionId();
        await Transaction.create({
          transactionId: txnId,
          type: 'deposit',
          receiverAccountId: account._id,
          receiverAccountNum: account.accountNumber,
          amount: request.amount,
          fee: 0,
          status: 'completed',
          description: request.description || 'Approved Cash Deposit',
        });
      } else if (request.type === 'withdrawal') {
        const updated = await BankAccount.findOneAndUpdate(
          { _id: account._id, balance: { $gte: request.amount } },
          { $inc: { balance: -request.amount } },
          { new: true }
        );

        if (!updated) {
          return NextResponse.json(
            { error: 'Account has insufficient funds for this withdrawal' },
            { status: 400 }
          );
        }

        const txnId = generateTransactionId();
        await Transaction.create({
          transactionId: txnId,
          type: 'withdrawal',
          senderAccountId: account._id,
          senderAccountNum: account.accountNumber,
          amount: request.amount,
          fee: 0,
          status: 'completed',
          description: request.description || 'Approved Cash Withdrawal',
        });
      }
    }

    request.status = action;
    request.reviewedBy = authUser.userId as any;
    request.reviewNotes = reviewNotes || `${authUser.name} (${authUser.role}): ${action}`;
    await request.save();

    const populated = await DepositWithdrawRequest.findById(id)
      .populate('userId', 'name email')
      .populate('accountId', 'accountNumber accountType')
      .populate('reviewedBy', 'name role');

    return NextResponse.json(populated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
