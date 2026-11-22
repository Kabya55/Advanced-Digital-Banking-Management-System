import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Loan from '@/models/Loan';
import BankAccount from '@/models/BankAccount';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

function generateTransactionId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${dateStr}-${randomChars}`;
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const { loanId, installmentNumber, accountId, pin } = await req.json();

    if (!pin) {
      return NextResponse.json({ error: 'Transaction PIN is required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(authUser.userId);
    if (!user || !user.transactionPin) {
      return NextResponse.json({ error: 'Please set up a Transaction PIN' }, { status: 400 });
    }

    const isPinValid = await bcrypt.compare(pin, user.transactionPin);
    if (!isPinValid) {
      return NextResponse.json({ error: 'Incorrect Transaction PIN' }, { status: 400 });
    }

    const loan = await Loan.findById(loanId);
    if (!loan || loan.status !== 'active') {
      return NextResponse.json({ error: 'Active loan not found' }, { status: 400 });
    }

    const installment = loan.repaymentSchedule.find(
      (item) => item.installmentNumber === installmentNumber && item.status === 'unpaid'
    );
    if (!installment) {
      return NextResponse.json(
        { error: 'Valid unpaid installment not found' },
        { status: 400 }
      );
    }

    const updatedAccount = await BankAccount.findOneAndUpdate(
      { _id: accountId, userId: authUser.userId, balance: { $gte: installment.amount } },
      { $inc: { balance: -installment.amount } },
      { new: true }
    );

    if (!updatedAccount) {
      return NextResponse.json(
        { error: 'Insufficient balance to pay installment' },
        { status: 400 }
      );
    }

    const txnId = generateTransactionId();
    const transaction = await Transaction.create({
      transactionId: txnId,
      type: 'loan_repayment',
      senderAccountId: updatedAccount._id,
      senderAccountNum: updatedAccount.accountNumber,
      amount: installment.amount,
      fee: 0,
      status: 'completed',
      description: `Loan Repayment Installment #${installmentNumber} (${loan.loanType})`,
    });

    installment.status = 'paid';
    installment.paidDate = new Date().toISOString();

    loan.remainingBalance = Math.max(0, loan.remainingBalance - installment.amount);
    loan.repayments.push({
      amount: installment.amount,
      date: new Date().toISOString(),
      transactionId: txnId,
      principal: Number((installment.amount * 0.85).toFixed(2)),
      interest: Number((installment.amount * 0.15).toFixed(2)),
    });

    const remainingUnpaid = loan.repaymentSchedule.filter((item) => item.status === 'unpaid');
    if (remainingUnpaid.length === 0 || loan.remainingBalance <= 0) {
      loan.status = 'completed';
    }

    await loan.save();

    return NextResponse.json({
      success: true,
      message: `Installment #${installmentNumber} paid successfully`,
      loan,
      transaction,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
