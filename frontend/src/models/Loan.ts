import mongoose, { Schema, Document, Model } from 'mongoose';
import { LoanType, LoanStatus, IRepaymentScheduleItem, ILoanRepayment } from '@/types';

export interface ILoanDocument extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  loanType: LoanType;
  amount: number;
  approvedAmount?: number;
  durationMonths: number;
  interestRate: number;
  monthlyIncome: number;
  employmentStatus: string;
  description: string;
  status: LoanStatus;
  disbursedTransactionId?: string;
  remainingBalance: number;
  monthlyInstallment: number;
  staffNotes?: string;
  repaymentSchedule: IRepaymentScheduleItem[];
  repayments: ILoanRepayment[];
  createdAt: Date;
  updatedAt: Date;
}

const RepaymentScheduleSchema = new Schema<IRepaymentScheduleItem>({
  installmentNumber: { type: Number, required: true },
  dueDate: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  paidDate: { type: String },
});

const RepaymentRecordSchema = new Schema<ILoanRepayment>({
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  transactionId: { type: String, required: true },
  principal: { type: Number, required: true },
  interest: { type: Number, required: true },
});

const LoanSchema = new Schema<ILoanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true, index: true },
    loanType: {
      type: String,
      enum: ['Personal', 'Home', 'Business', 'Education', 'Vehicle'],
      required: true,
    },
    amount: { type: Number, required: true, min: 100 },
    approvedAmount: { type: Number },
    durationMonths: { type: Number, required: true, min: 1 },
    interestRate: { type: Number, default: 8.5 },
    monthlyIncome: { type: Number, required: true },
    employmentStatus: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'active', 'completed'],
      default: 'pending',
      index: true,
    },
    disbursedTransactionId: { type: String },
    remainingBalance: { type: Number, default: 0 },
    monthlyInstallment: { type: Number, default: 0 },
    staffNotes: { type: String, default: '' },
    repaymentSchedule: [RepaymentScheduleSchema],
    repayments: [RepaymentRecordSchema],
  },
  {
    timestamps: true,
  }
);

const Loan: Model<ILoanDocument> =
  mongoose.models.Loan || mongoose.model<ILoanDocument>('Loan', LoanSchema);

export default Loan;
