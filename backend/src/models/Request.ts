import mongoose, { Schema, Document, Model } from 'mongoose';

export type RequestType = 'deposit' | 'withdrawal';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface IDepositWithdrawRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  type: RequestType;
  amount: number;
  description: string;
  status: RequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepositWithdrawRequestSchema = new Schema<IDepositWithdrawRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true, index: true },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal'],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const DepositWithdrawRequest: Model<IDepositWithdrawRequestDocument> =
  mongoose.models.DepositWithdrawRequest ||
  mongoose.model<IDepositWithdrawRequestDocument>(
    'DepositWithdrawRequest',
    DepositWithdrawRequestSchema
  );

export default DepositWithdrawRequest;
