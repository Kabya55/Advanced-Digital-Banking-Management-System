export type UserRole = 'admin' | 'staff' | 'customer';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  status: UserStatus;
  isBlocked: boolean;
  hasPin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 'Savings' | 'Current' | 'Business';
export type AccountStatus = 'active' | 'frozen' | 'closed';

export interface IBankAccount {
  _id: string;
  accountNumber: string;
  userId: string | IUser;
  accountType: AccountType;
  balance: number;
  currency: string;
  status: AccountStatus;
  dailyTransferLimit: number;
  perTransactionLimit: number;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'fund_transfer'
  | 'loan_disbursement'
  | 'loan_repayment';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface ITransaction {
  _id: string;
  transactionId: string;
  type: TransactionType;
  senderAccountId?: string | IBankAccount;
  receiverAccountId?: string | IBankAccount;
  senderAccountNum?: string;
  receiverAccountNum?: string;
  amount: number;
  fee: number;
  status: TransactionStatus;
  description: string;
  flaggedForReview?: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestType = 'deposit' | 'withdrawal';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface IDepositWithdrawRequest {
  _id: string;
  userId: string | IUser;
  accountId: string | IBankAccount;
  type: RequestType;
  amount: number;
  description: string;
  status: RequestStatus;
  reviewedBy?: string | IUser;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LoanType = 'Personal' | 'Home' | 'Business' | 'Education' | 'Vehicle';
export type LoanStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'completed';

export interface IRepaymentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: 'unpaid' | 'paid';
  paidDate?: string;
}

export interface ILoanRepayment {
  amount: number;
  date: string;
  transactionId: string;
  principal: number;
  interest: number;
}

export interface ILoan {
  _id: string;
  userId: string | IUser;
  accountId: string | IBankAccount;
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
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    isBlocked: boolean;
    hasPin: boolean;
  };
  token: string;
}

export interface AdminAnalytics {
  totalCustomers: number;
  totalAccounts: number;
  totalBankBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransactions: number;
  pendingLoans: number;
  monthlyVolume: { month: string; deposits: number; withdrawals: number; transfers: number }[];
  accountDistribution: { name: string; value: number }[];
  loanStatistics: { status: string; count: number }[];
}

export interface CustomerAnalytics {
  monthlySpending: { month: string; amount: number }[];
  monthlyDepositHistory: { month: string; amount: number }[];
  transactionDistribution: { name: string; value: number }[];
}
