import mongoose, { Schema, Document, Model } from 'mongoose';
import { TransactionType, TransactionStatus } from '@/types';

export interface ITransactionDocument extends Document {
  transactionId: string;
  type: TransactionType;
  senderAccountId?: mongoose.Types.ObjectId;
  receiverAccountId?: mongoose.Types.ObjectId;
  senderAccountNum?: string;
  receiverAccountNum?: string;
  amount: number;
  fee: number;
  status: TransactionStatus;
  description: string;
  flaggedForReview: boolean;
  flagReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'fund_transfer', 'loan_disbursement', 'loan_repayment'],
      required: true,
      index: true,
    },
    senderAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', index: true },
    receiverAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', index: true },
    senderAccountNum: { type: String, trim: true },
    receiverAccountNum: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    fee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'reversed'],
      default: 'completed',
      index: true,
    },
    description: { type: String, default: '' },
    flaggedForReview: { type: Boolean, default: false, index: true },
    flagReason: { type: String },
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<ITransactionDocument> =
  mongoose.models.Transaction ||
  mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);

export default Transaction;
