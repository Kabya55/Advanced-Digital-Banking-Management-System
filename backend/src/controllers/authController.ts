import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import { AuthRequest } from '../middleware/auth.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        error: 'Your account has been blocked. Please contact bank administration.',
      });
      return;
    }

    if (user.status === 'suspended' || user.status === 'inactive') {
      res.status(403).json({
        success: false,
        error: `Account is ${user.status}. Access is restricted.`,
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        isBlocked: user.isBlocked,
      },
      process.env.JWT_SECRET || 'advanced-digital-banking-secret-key-32chars',
      { expiresIn: '7d' }
    );

    const userObj = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      status: user.status,
      isBlocked: user.isBlocked,
      hasPin: !!user.transactionPin,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    res.cookie('bank_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: userObj,
      token,
      hasPin: !!user.transactionPin,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'An account with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'customer',
      phone: phone || '',
      address: address || '',
      status: 'pending',
      isBlocked: false,
    });

    // Auto-create initial Savings Account with $1,000 welcome balance
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const accountNumber = `10${randomSuffix}`;

    await BankAccount.create({
      accountNumber,
      userId: newUser._id,
      accountType: 'Savings',
      balance: 1000,
      currency: 'USD',
      status: 'pending',
      dailyTransferLimit: 50000,
      perTransactionLimit: 20000,
    });

    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        isBlocked: newUser.isBlocked,
      },
      process.env.JWT_SECRET || 'advanced-digital-banking-secret-key-32chars',
      { expiresIn: '7d' }
    );

    const userObj = {
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      address: newUser.address,
      status: newUser.status,
      isBlocked: newUser.isBlocked,
      hasPin: false,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    };

    res.cookie('bank_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      user: userObj,
      token,
      message: 'Account created with initial $1,000 Savings balance!',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        status: user.status,
        isBlocked: user.isBlocked,
        hasPin: !!user.transactionPin,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      hasPin: !!user.transactionPin,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const setTransactionPin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pin, currentPin } = req.body;

    if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      res.status(400).json({ success: false, error: 'PIN must be 4 to 6 numeric digits' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (user.transactionPin) {
      if (!currentPin) {
        res.status(400).json({ success: false, error: 'Current PIN is required to change PIN' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPin, user.transactionPin);
      if (!isMatch) {
        res.status(400).json({ success: false, error: 'Current PIN is incorrect' });
        return;
      }
    }

    user.transactionPin = await bcrypt.hash(pin, 10);
    await user.save();

    res.json({ success: true, message: 'Transaction PIN configured successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
