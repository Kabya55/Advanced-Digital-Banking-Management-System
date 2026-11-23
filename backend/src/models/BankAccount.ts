import mongoose, { Schema, Document, Model } from 'mongoose';

export type AccountType = 'Savings' | 'Current' | 'Business';
export type AccountStatus = 'active' | 'frozen' | 'closed' | 'pending';

export interface IBankAccountDocument extends Document {
  accountNumber: string;
  userId: mongoose.Types.ObjectId;
  accountType: AccountType;
  balance: number;
  currency: string;
  status: AccountStatus;
  dailyTransferLimit: number;
  perTransactionLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const BankAccountSchema = new Schema<IBankAccountDocument>(
  {
    accountNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountType: {
      type: String,
      enum: ['Savings', 'Current', 'Business'],
      default: 'Savings',
      required: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['active', 'frozen', 'closed', 'pending'],
      default: 'pending',
    },
    dailyTransferLimit: { type: Number, default: 50000 },
    perTransactionLimit: { type: Number, default: 20000 },
  },
  {
    timestamps: true,
  }
);

const BankAccount: Model<IBankAccountDocument> =
  mongoose.models.BankAccount ||
  mongoose.model<IBankAccountDocument>('BankAccount', BankAccountSchema);

export default BankAccount;
