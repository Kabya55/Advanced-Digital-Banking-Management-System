import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
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

    const { senderAccountId, receiverAccountNumber, amount, description, pin } =
      await req.json();

    const transferAmount = Number(amount);
    if (!transferAmount || transferAmount <= 0 || isNaN(transferAmount)) {
      return NextResponse.json(
        { error: 'Valid transfer amount greater than $0 is required' },
        { status: 400 }
      );
    }

    if (!pin) {
      return NextResponse.json(
        { error: 'Transaction PIN is required to authorize this transfer' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Verify User and Transaction PIN
    const user = await User.findById(authUser.userId);
    if (!user) return unauthorizedResponse();

    if (!user.transactionPin) {
      return NextResponse.json(
        {
          error:
            'You have not set up a Transaction PIN yet. Please set up your PIN in Profile settings.',
        },
        { status: 400 }
      );
    }

    const isPinValid = await bcrypt.compare(pin, user.transactionPin);
    if (!isPinValid) {
      return NextResponse.json(
        { error: 'Incorrect Transaction PIN. Verification failed.' },
        { status: 400 }
      );
    }

    // 2. Sender Account Validation
    const senderAccount = await BankAccount.findById(senderAccountId);
    if (!senderAccount) {
      return NextResponse.json({ error: 'Sender bank account not found' }, { status: 404 });
    }

    if (
      authUser.role === 'customer' &&
      senderAccount.userId.toString() !== authUser.userId
    ) {
      return forbiddenResponse('You do not own this bank account');
    }

    if (senderAccount.status !== 'active') {
      return NextResponse.json(
        { error: `Sender account is ${senderAccount.status}. Transfers are disabled.` },
        { status: 400 }
      );
    }

    if (transferAmount > senderAccount.perTransactionLimit) {
      return NextResponse.json(
        {
          error: `Amount exceeds the per-transaction limit of $${senderAccount.perTransactionLimit.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    if (senderAccount.balance < transferAmount) {
      return NextResponse.json(
        {
          error: `Insufficient account balance. Available: $${senderAccount.balance.toFixed(
            2
          )}, Requested: $${transferAmount.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // 3. Recipient Account Validation
    const cleanReceiverNum = receiverAccountNumber.trim();
    if (senderAccount.accountNumber === cleanReceiverNum) {
      return NextResponse.json(
        { error: 'Cannot transfer funds to the same bank account' },
        { status: 400 }
      );
    }

    const receiverAccount = await BankAccount.findOne({
      accountNumber: cleanReceiverNum,
    });
    if (!receiverAccount) {
      return NextResponse.json(
        { error: `Destination account number "${cleanReceiverNum}" was not found.` },
        { status: 404 }
      );
    }

    if (receiverAccount.status !== 'active') {
      return NextResponse.json(
        {
          error: `Recipient bank account is currently ${receiverAccount.status}. Transfer cannot be completed.`,
        },
        { status: 400 }
      );
    }

    // 4. ATOMIC EXECUTION TO PREVENT RACE CONDITIONS
    const updatedSender = await BankAccount.findOneAndUpdate(
      {
        _id: senderAccountId,
        balance: { $gte: transferAmount },
        status: 'active',
      },
      {
        $inc: { balance: -transferAmount },
      },
      { new: true }
    );

    if (!updatedSender) {
      return NextResponse.json(
        { error: 'Transfer failed: Insufficient balance or account state modified.' },
        { status: 400 }
      );
    }

    const updatedReceiver = await BankAccount.findByIdAndUpdate(
      receiverAccount._id,
      {
        $inc: { balance: transferAmount },
      },
      { new: true }
    );

    if (!updatedReceiver) {
      await BankAccount.findByIdAndUpdate(senderAccountId, {
        $inc: { balance: transferAmount },
      });
      return NextResponse.json(
        { error: 'Transfer failed during credit operation. Rolled back safely.' },
        { status: 500 }
      );
    }

    // 5. Create Transaction Record
    const transactionId = generateTransactionId();
    const transaction = await Transaction.create({
      transactionId,
      type: 'fund_transfer',
      senderAccountId: senderAccount._id,
      receiverAccountId: receiverAccount._id,
      senderAccountNum: senderAccount.accountNumber,
      receiverAccountNum: receiverAccount.accountNumber,
      amount: transferAmount,
      fee: 0,
      status: 'completed',
      description: description?.trim() || `Fund transfer to ${receiverAccount.accountNumber}`,
    });

    const populatedTxn = await Transaction.findById(transaction._id)
      .populate('senderAccountId', 'accountNumber accountType')
      .populate('receiverAccountId', 'accountNumber accountType');

    return NextResponse.json({
      success: true,
      message: 'Fund transfer completed successfully',
      transaction: populatedTxn,
      newBalance: updatedSender.balance,
    });
  } catch (error: any) {
    console.error('Transfer error:', error);
    return NextResponse.json({ error: error.message || 'Transfer failed' }, { status: 500 });
  }
}
