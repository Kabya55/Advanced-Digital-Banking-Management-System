import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import Loan from '../models/Loan.js';
import { AuthRequest } from '../middleware/auth.js';

export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, role } = req.query;

    let query: any = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    const accounts = await BankAccount.find({ userId: customer._id });
    const accountIds = accounts.map((a) => a._id);

    const [loans, transactions] = await Promise.all([
      Loan.find({ userId: customer._id }).sort({ createdAt: -1 }),
      Transaction.find({
        $or: [{ senderAccountId: { $in: accountIds } }, { receiverAccountId: { $in: accountIds } }],
      })
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    res.json({
      customer,
      accounts,
      loans,
      transactions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCustomerStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, isBlocked, role } = req.body;

    if (role && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only administrators can change user roles' });
      return;
    }

    const updateData: any = {};

    if (status) updateData.status = status;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    if (role) updateData.role = role;

    const customer = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select('-password');

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    // Synchronize customer bank accounts status on approval or suspension
    if (status === 'active') {
      await BankAccount.updateMany({ userId: customer._id }, { status: 'active' });
    } else if (status === 'inactive' || status === 'suspended') {
      await BankAccount.updateMany({ userId: customer._id }, { status: 'frozen' });
    }

    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const registerCustomerByStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, address, accountType = 'Savings', initialDeposit = 0 } = req.body;

    if (!name || !email) {
      res.status(400).json({ success: false, error: 'Name and email are required' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, error: 'Customer with this email already exists' });
      return;
    }

    const defaultPassword = 'Customer@1234';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const customer = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'customer',
      phone: phone || '',
      address: address || '',
      status: 'active',
      isBlocked: false,
    });

    let accountNumber = '';
    let exists = true;
    while (exists) {
      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
      accountNumber = `10${randomSuffix}`;
      const found = await BankAccount.findOne({ accountNumber });
      if (!found) exists = false;
    }

    const account = await BankAccount.create({
      accountNumber,
      userId: customer._id,
      accountType,
      balance: Math.max(0, Number(initialDeposit)),
      currency: 'USD',
      status: 'active',
      dailyTransferLimit: 50000,
      perTransactionLimit: 20000,
    });

    res.status(201).json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        role: customer.role,
      },
      account,
      tempPassword: defaultPassword,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
