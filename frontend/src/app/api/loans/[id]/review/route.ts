import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Loan from '@/models/Loan';
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

    const { id } = await params;
    const { action, approvedAmount, staffNotes } = await req.json();

    await connectToDatabase();

    const loan = await Loan.findById(id).populate('accountId');
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    if (authUser.role === 'staff') {
      if (action === 'approved') {
        return forbiddenResponse(
          'Bank Staff does not have permission to approve loans. Forward to Admin.'
        );
      }

      if (staffNotes) {
        loan.staffNotes = `${authUser.name} (Staff Note): ${staffNotes}`;
      }
      if (action === 'under_review') {
        loan.status = 'under_review';
      }
      await loan.save();

      const updated = await Loan.findById(id)
        .populate('userId', 'name email phone')
        .populate('accountId', 'accountNumber accountType');
      return NextResponse.json(updated);
    }

    if (authUser.role === 'admin') {
      if (staffNotes) {
        loan.staffNotes = loan.staffNotes
          ? `${loan.staffNotes} | Admin Note: ${staffNotes}`
          : `Admin Note: ${staffNotes}`;
      }

      if (action === 'rejected') {
        loan.status = 'rejected';
        await loan.save();
        return NextResponse.json(loan);
      }

      if (action === 'approved') {
        const finalApproved = Number(approvedAmount) || loan.amount;
        loan.approvedAmount = finalApproved;
        loan.status = 'active';

        await BankAccount.findByIdAndUpdate(
          loan.accountId._id,
          { $inc: { balance: finalApproved } },
          { new: true }
        );

        const txnId = generateTransactionId();
        await Transaction.create({
          transactionId: txnId,
          type: 'loan_disbursement',
          receiverAccountId: loan.accountId._id,
          receiverAccountNum: (loan.accountId as any).accountNumber,
          amount: finalApproved,
          fee: 0,
          status: 'completed',
          description: `Approved ${loan.loanType} Loan Disbursement (#${loan._id.toString().slice(-6)})`,
        });

        loan.disbursedTransactionId = txnId;
        await loan.save();

        const updated = await Loan.findById(id)
          .populate('userId', 'name email phone')
          .populate('accountId', 'accountNumber accountType balance');
        return NextResponse.json(updated);
      }
    }

    return NextResponse.json({ error: 'Invalid review action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
