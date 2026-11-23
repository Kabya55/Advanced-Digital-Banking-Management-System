import { Response } from 'express';
import bcrypt from 'bcryptjs';
import Loan from '../models/Loan.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

function generateTransactionId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${dateStr}-${randomChars}`;
}

export const getLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, status } = req.query;
    let filter: any = {};

    if (req.user?.role === 'customer') {
      filter.userId = req.user.userId;
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

    res.json(loans);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLoanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('userId', 'name email phone status isBlocked')
      .populate('accountId', 'accountNumber accountType balance');

    if (!loan) {
      res.status(404).json({ success: false, error: 'Loan not found' });
      return;
    }

    if (
      req.user?.role === 'customer' &&
      loan.userId._id.toString() !== req.user.userId
    ) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.json(loan);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const applyLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      accountId,
      loanType,
      amount,
      durationMonths,
      monthlyIncome,
      employmentStatus,
      description,
    } = req.body;

    const requestedAmount = Number(amount);
    const months = Number(durationMonths);

    if (!requestedAmount || requestedAmount < 100) {
      res.status(400).json({ success: false, error: 'Minimum loan amount is $100' });
      return;
    }

    if (!months || months < 1 || months > 120) {
      res.status(400).json({ success: false, error: 'Loan duration must be between 1 and 120 months' });
      return;
    }

    // Account validation
    const account = await BankAccount.findById(accountId);
    if (!account) {
      res.status(404).json({ success: false, error: 'Disbursement account not found' });
      return;
    }

    if (account.userId.toString() !== req.user?.userId) {
      res.status(403).json({ success: false, error: 'You do not own this bank account' });
      return;
    }

    if (account.status !== 'active') {
      res.status(403).json({
        success: false,
        error: 'Cannot apply for a loan. Your account is pending verification or inactive.',
      });
      return;
    }

    const interestRate = 8.5; // 8.5% annual rate
    const monthlyRate = interestRate / 100 / 12;
    // Standard amortization formula: M = P * (r*(1+r)^n) / ((1+r)^n - 1)
    const monthlyInstallment = Number(
      (
        (requestedAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
        (Math.pow(1 + monthlyRate, months) - 1)
      ).toFixed(2)
    );

    // Build tentative repayment schedule
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
      userId: req.user.userId,
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

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reviewLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, approvedAmount, staffNotes } = req.body;

    const loan = await Loan.findById(id).populate('accountId');
    if (!loan) {
      res.status(404).json({ success: false, error: 'Loan not found' });
      return;
    }

    // Bank Staff capabilities: forward, add internal notes, set to 'under_review'
    // Staff CANNOT approve loans as per specification!
    if (req.user?.role === 'staff') {
      if (action === 'approved') {
        res.status(403).json({
          success: false,
          error: 'Bank Staff does not have permission to approve loans. Forward to Admin.',
        });
        return;
      }

      if (staffNotes) {
        loan.staffNotes = `${req.user.name} (Staff Note): ${staffNotes}`;
      }
      if (action === 'under_review') {
        loan.status = 'under_review';
      }
      await loan.save();

      const updated = await Loan.findById(id)
        .populate('userId', 'name email phone')
        .populate('accountId', 'accountNumber accountType');
      res.json(updated);
      return;
    }

    // Admin capabilities: Approve or Reject
    if (req.user?.role === 'admin') {
      if (staffNotes) {
        loan.staffNotes = loan.staffNotes
          ? `${loan.staffNotes} | Admin Note: ${staffNotes}`
          : `Admin Note: ${staffNotes}`;
      }

      if (action === 'rejected') {
        loan.status = 'rejected';
        await loan.save();
        res.json(loan);
        return;
      }

      if (action === 'approved') {
        const finalApproved = Number(approvedAmount) || loan.amount;
        loan.approvedAmount = finalApproved;
        loan.status = 'active';

        // Disburse loan funds into the customer's account atomically
        const updatedAccount = await BankAccount.findByIdAndUpdate(
          loan.accountId._id,
          { $inc: { balance: finalApproved } },
          { new: true }
        );

        // Record banking transaction for loan disbursement
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
        res.json(updated);
        return;
      }
    }

    res.status(400).json({ success: false, error: 'Invalid review action' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const repayLoanInstallment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId, installmentNumber, accountId, pin } = req.body;

    if (!pin) {
      res.status(400).json({ success: false, error: 'Transaction PIN is required' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user || !user.transactionPin) {
      res.status(400).json({ success: false, error: 'Please set up a Transaction PIN' });
      return;
    }

    const isPinValid = await bcrypt.compare(pin, user.transactionPin);
    if (!isPinValid) {
      res.status(400).json({ success: false, error: 'Incorrect Transaction PIN' });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan || loan.status !== 'active') {
      res.status(400).json({ success: false, error: 'Active loan not found' });
      return;
    }

    const installment = loan.repaymentSchedule.find(
      (item) => item.installmentNumber === installmentNumber && item.status === 'unpaid'
    );
    if (!installment) {
      res.status(400).json({ success: false, error: 'Valid unpaid installment not found' });
      return;
    }

    // Debit customer's account atomically
    const updatedAccount = await BankAccount.findOneAndUpdate(
      { _id: accountId, userId: req.user?.userId, balance: { $gte: installment.amount } },
      { $inc: { balance: -installment.amount } },
      { new: true }
    );

    if (!updatedAccount) {
      res.status(400).json({ success: false, error: 'Insufficient balance to pay installment' });
      return;
    }

    // Record Transaction
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

    // If all installments are paid or remaining balance is 0
    const remainingUnpaid = loan.repaymentSchedule.filter((item) => item.status === 'unpaid');
    if (remainingUnpaid.length === 0 || loan.remainingBalance <= 0) {
      loan.status = 'completed';
    }

    await loan.save();

    res.json({
      success: true,
      message: `Installment #${installmentNumber} paid successfully`,
      loan,
      transaction,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
