import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Loan from '@/models/Loan';
import BankAccount from '@/models/BankAccount';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let filter: any = {};

    if (authUser.role === 'customer') {
      filter.userId = authUser.userId;
    } else if (userId) {
      filter.userId = userId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const loans = await Loan.find(filter)
      .populate('userId', 'name email phone status isBlocked')
      .populate('accountId', 'accountNumber accountType balance')
      .sort({ createdAt: -1 });

    return NextResponse.json(loans);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const {
      accountId,
      loanType,
      amount,
      durationMonths,
      monthlyIncome,
      employmentStatus,
      description,
    } = await req.json();

    const requestedAmount = Number(amount);
    const months = Number(durationMonths);

    if (!requestedAmount || requestedAmount < 100) {
      return NextResponse.json({ error: 'Minimum loan amount is $100' }, { status: 400 });
    }

    if (!months || months < 1 || months > 120) {
      return NextResponse.json(
        { error: 'Loan duration must be between 1 and 120 months' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const account = await BankAccount.findById(accountId);
    if (!account) {
      return NextResponse.json({ error: 'Disbursement account not found' }, { status: 404 });
    }

    if (account.userId.toString() !== authUser.userId) {
      return NextResponse.json({ error: 'You do not own this bank account' }, { status: 403 });
    }

    const interestRate = 8.5;
    const monthlyRate = interestRate / 100 / 12;
    const monthlyInstallment = Number(
      (
        (requestedAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
        (Math.pow(1 + monthlyRate, months) - 1)
      ).toFixed(2)
    );

    const schedule = [];
    const now = new Date();
    for (let i = 1; i <= months; i++) {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30 * i);
      schedule.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().slice(0, 10),
        amount: monthlyInstallment,
        status: 'unpaid' as const,
      });
    }

    const loan = await Loan.create({
      userId: authUser.userId,
      accountId,
      loanType,
      amount: requestedAmount,
      approvedAmount: requestedAmount,
      durationMonths: months,
      interestRate,
      monthlyIncome: Number(monthlyIncome),
      employmentStatus,
      description: description || '',
      status: 'pending',
      remainingBalance: Number((monthlyInstallment * months).toFixed(2)),
      monthlyInstallment,
      repaymentSchedule: schedule,
      repayments: [],
    });

    const populated = await Loan.findById(loan._id)
      .populate('userId', 'name email phone')
      .populate('accountId', 'accountNumber accountType');

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
