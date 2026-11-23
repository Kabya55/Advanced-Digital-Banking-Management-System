import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { signJWT } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'Your account has been blocked. Please contact bank administration.' },
        { status: 403 }
      );
    }

    if (user.status === 'suspended' || user.status === 'inactive') {
      return NextResponse.json(
        { error: `Your account is currently ${user.status}. Access is restricted.` },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signJWT({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      isBlocked: user.isBlocked,
    });

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

    const res = NextResponse.json({
      success: true,
      user: userObj,
      token,
      hasPin: !!user.transactionPin,
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
