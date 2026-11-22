import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import BankAccount from '@/models/BankAccount';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    if (authUser.role !== 'staff' && authUser.role !== 'admin') {
      return forbiddenResponse();
    }

    const { name, email, phone, address, accountType = 'Savings', initialDeposit = 0 } =
      await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      );
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

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
