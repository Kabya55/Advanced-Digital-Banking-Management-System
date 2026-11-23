import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'staff' | 'customer';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  address?: string;
  status: UserStatus;
  isBlocked: boolean;
  transactionPin?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'staff', 'customer'],
      default: 'customer',
      required: true,
    },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'pending',
    },
    isBlocked: { type: Boolean, default: false },
    transactionPin: { type: String }, // Hashed 4-6 digit PIN
  },
  {
    timestamps: true,
  }
);

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
