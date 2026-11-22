import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import Loan from '../models/Loan.js';
import DepositWithdrawRequest from '../models/Request.js';

// Fix Windows SRV DNS resolution failure for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function seedDatabase() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing');
    process.exit(1);
  }

  console.log('Connecting to database for seeding...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected! Resetting existing collections...');

  await Promise.all([
    User.deleteMany({}),
    BankAccount.deleteMany({}),
    Transaction.deleteMany({}),
    Loan.deleteMany({}),
    DepositWithdrawRequest.deleteMany({}),
  ]);

  const defaultPin = '1234';
  const hashedPin = await bcrypt.hash(defaultPin, 10);

  // 1. Create Admin
  const adminPassword = await bcrypt.hash('Admin@1234', 10);
  const admin = await User.create({
    name: 'Chief Banking Administrator',
    email: 'admin@bank.com',
    password: adminPassword,
    role: 'admin',
    phone: '+1 800 555 0199',
    address: 'One Financial Plaza, Suite 400, New York, NY',
    status: 'active',
    isBlocked: false,
    transactionPin: hashedPin,
  });

  // 2. Create Bank Staff
  const staffPassword = await bcrypt.hash('Staff@1234', 10);
  const staff = await User.create({
    name: 'Emily Davis (Loan & Compliance Officer)',
    email: 'staff@bank.com',
    password: staffPassword,
    role: 'staff',
    phone: '+1 800 555 0142',
    address: 'FinTech Tower, Branch #12, Manhattan, NY',
    status: 'active',
    isBlocked: false,
    transactionPin: hashedPin,
  });

  // 3. Create Main Customer
  const customerPassword = await bcrypt.hash('Customer@1234', 10);
  const customer = await User.create({
    name: 'Alexander Wright',
    email: 'customer@bank.com',
    password: customerPassword,
    role: 'customer',
    phone: '+1 212 555 0177',
    address: '742 Evergreen Terrace, New York, NY',
    status: 'active',
    isBlocked: false,
    transactionPin: hashedPin,
  });

  // 4. Create Secondary Customer (for fund transfers)
  const sarah = await User.create({
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@bank.com',
    password: customerPassword,
    role: 'customer',
    phone: '+1 212 555 0188',
    address: '124 Conch Street, Brooklyn, NY',
    status: 'active',
    isBlocked: false,
    transactionPin: hashedPin,
  });

  console.log('Created Users: Admin, Staff, Customer (Alexander), Customer (Sarah)');

  // 5. Create Bank Accounts
  const alexSavings = await BankAccount.create({
    accountNumber: '1089234512',
    userId: customer._id,
    accountType: 'Savings',
    balance: 45250.75,
    currency: 'USD',
    status: 'active',
    dailyTransferLimit: 50000,
    perTransactionLimit: 25000,
  });

  const alexCurrent = await BankAccount.create({
    accountNumber: '1089234588',
    userId: customer._id,
    accountType: 'Current',
    balance: 12800.5,
    currency: 'USD',
    status: 'active',
    dailyTransferLimit: 50000,
    perTransactionLimit: 20000,
  });

  const alexBusiness = await BankAccount.create({
    accountNumber: '1089234599',
    userId: customer._id,
    accountType: 'Business',
    balance: 125000.0,
    currency: 'USD',
    status: 'active',
    dailyTransferLimit: 150000,
    perTransactionLimit: 50000,
  });

  const sarahSavings = await BankAccount.create({
    accountNumber: '1099887766',
    userId: sarah._id,
    accountType: 'Savings',
    balance: 15400.0,
    currency: 'USD',
    status: 'active',
    dailyTransferLimit: 50000,
    perTransactionLimit: 20000,
  });

  console.log('Created Bank Accounts');

  // 6. Seed Realistic Transactions (spanning previous months for charts)
  const now = new Date();
  const txns = [
    {
      transactionId: 'TXN-20261015-A109B2',
      type: 'deposit',
      receiverAccountId: alexSavings._id,
      receiverAccountNum: alexSavings.accountNumber,
      amount: 15000,
      fee: 0,
      status: 'completed',
      description: 'Initial Salary Direct Deposit',
      createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 15),
    },
    {
      transactionId: 'TXN-20261022-C887E1',
      type: 'fund_transfer',
      senderAccountId: alexSavings._id,
      receiverAccountId: sarahSavings._id,
      senderAccountNum: alexSavings.accountNumber,
      receiverAccountNum: sarahSavings.accountNumber,
      amount: 2500,
      fee: 0,
      status: 'completed',
      description: 'Consulting Service Payment',
      createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 22),
    },
    {
      transactionId: 'TXN-20261102-D541F3',
      type: 'deposit',
      receiverAccountId: alexBusiness._id,
      receiverAccountNum: alexBusiness.accountNumber,
      amount: 50000,
      fee: 0,
      status: 'completed',
      description: 'Q3 Enterprise Client Wire Transfer',
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 2),
    },
    {
      transactionId: 'TXN-20261110-E720G4',
      type: 'withdrawal',
      senderAccountId: alexCurrent._id,
      senderAccountNum: alexCurrent.accountNumber,
      amount: 1200,
      fee: 0,
      status: 'completed',
      description: 'ATM Cash Withdrawal - Midtown Branch',
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 10),
    },
    {
      transactionId: 'TXN-20261118-H993J5',
      type: 'fund_transfer',
      senderAccountId: alexSavings._id,
      receiverAccountId: alexCurrent._id,
      senderAccountNum: alexSavings.accountNumber,
      receiverAccountNum: alexCurrent.accountNumber,
      amount: 3000,
      fee: 0,
      status: 'completed',
      description: 'Internal transfer to Current Account',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 5),
    },
    {
      transactionId: 'TXN-20261120-K112L6',
      type: 'fund_transfer',
      senderAccountId: alexCurrent._id,
      receiverAccountId: sarahSavings._id,
      senderAccountNum: alexCurrent.accountNumber,
      receiverAccountNum: sarahSavings.accountNumber,
      amount: 450,
      fee: 0,
      status: 'completed',
      description: 'Monthly office rent split',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 12),
    },
    {
      transactionId: 'TXN-20261121-M445N7',
      type: 'withdrawal',
      senderAccountId: alexBusiness._id,
      senderAccountNum: alexBusiness.accountNumber,
      amount: 4800,
      fee: 0,
      status: 'completed',
      description: 'Vendor Equipment Procurement',
      flaggedForReview: true,
      flagReason: 'Emily Davis (staff): Large corporate withdrawal flagged for compliance verification',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 18),
    },
  ];

  await Transaction.insertMany(txns);
  console.log('Seeded Transactions');

  // 7. Seed Loans
  const schedule = [];
  for (let i = 1; i <= 12; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + 30 * i);
    schedule.push({
      installmentNumber: i,
      dueDate: d.toISOString().slice(0, 10),
      amount: 1745.2,
      status: i <= 2 ? ('paid' as const) : ('unpaid' as const),
      paidDate: i <= 2 ? new Date(now.getTime() - (3 - i) * 30 * 86400000).toISOString() : undefined,
    });
  }

  await Loan.create({
    userId: customer._id,
    accountId: alexSavings._id,
    loanType: 'Business',
    amount: 20000,
    approvedAmount: 20000,
    durationMonths: 12,
    interestRate: 8.5,
    monthlyIncome: 14500,
    employmentStatus: 'Self-Employed / Business Owner',
    description: 'Working Capital & Inventory Expansion',
    status: 'active',
    disbursedTransactionId: 'TXN-20261010-LOAN01',
    remainingBalance: 17452.0,
    monthlyInstallment: 1745.2,
    staffNotes: 'Emily Davis (staff): Credit score 785 verified. Recommended for full approval.',
    repaymentSchedule: schedule,
    repayments: [
      {
        amount: 1745.2,
        date: new Date(now.getTime() - 60 * 86400000).toISOString(),
        transactionId: 'TXN-20261020-REPAY1',
        principal: 1483.42,
        interest: 261.78,
      },
      {
        amount: 1745.2,
        date: new Date(now.getTime() - 30 * 86400000).toISOString(),
        transactionId: 'TXN-20261115-REPAY2',
        principal: 1483.42,
        interest: 261.78,
      },
    ],
  });

  // Pending Loan for Admin/Staff Review
  await Loan.create({
    userId: sarah._id,
    accountId: sarahSavings._id,
    loanType: 'Home',
    amount: 75000,
    durationMonths: 60,
    interestRate: 8.5,
    monthlyIncome: 9200,
    employmentStatus: 'Full-time Senior Software Engineer',
    description: 'Home Renovation & Solar Installation',
    status: 'under_review',
    remainingBalance: 92140.0,
    monthlyInstallment: 1535.67,
    staffNotes: 'Emily Davis (staff): Income documents verified. Forwarded to Admin for final approval.',
    repaymentSchedule: [],
    repayments: [],
  });

  console.log('Seeded Loans');

  // 8. Seed Deposit/Withdrawal Requests
  await DepositWithdrawRequest.create({
    userId: customer._id,
    accountId: alexCurrent._id,
    type: 'deposit',
    amount: 5000,
    description: 'Check deposit from client consulting retainer',
    status: 'pending',
  });

  await DepositWithdrawRequest.create({
    userId: sarah._id,
    accountId: sarahSavings._id,
    type: 'withdrawal',
    amount: 1500,
    description: 'Cashier check request for contractor payment',
    status: 'pending',
  });

  console.log('Seeded Deposit/Withdrawal Requests');

  console.log(`
========================================================================
🎉 SEED COMPLETED SUCCESSFULLY!
Demo Credentials:
  1. ADMIN:
     Email: admin@bank.com
     Password: Admin@1234
     Role: admin

  2. BANK STAFF:
     Email: staff@bank.com
     Password: Staff@1234
     Role: staff

  3. CUSTOMER:
     Email: customer@bank.com
     Password: Customer@1234
     Role: customer
     Transaction PIN: 1234
     Accounts:
       - Savings: 1089234512 ($45,250.75)
       - Current: 1089234588 ($12,800.50)
       - Business: 1089234599 ($125,000.00)

  4. SECOND CUSTOMER (Recipient for Transfers):
     Email: sarah.jenkins@bank.com
     Password: Customer@1234
     Account: 1099887766 ($15,400.00)
========================================================================
  `);

  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
