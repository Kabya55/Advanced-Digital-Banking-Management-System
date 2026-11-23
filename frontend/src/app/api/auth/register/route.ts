import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import BankAccount from '@/models/BankAccount';
import { signJWT } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, address } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
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

    // Auto-create initial Savings account with $1,000 welcome balance
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

    const token = await signJWT({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      status: newUser.status,
      isBlocked: newUser.isBlocked,
    });

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

    const res = NextResponse.json({
      success: true,
      user: userObj,
      token,
      message: 'Account created successfully with a new Savings Account ($1,000 welcome balance)!',
    });

    res.cookies.set('bank_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
