import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { pin, currentPin } = await req.json();

    if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be between 4 and 6 numeric digits' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(authUser.userId);
    if (!user) return unauthorizedResponse();

    if (user.transactionPin) {
      if (!currentPin) {
        return NextResponse.json(
          { error: 'Current PIN is required to change your PIN' },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(currentPin, user.transactionPin);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Current PIN is incorrect' },
          { status: 400 }
        );
      }
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    user.transactionPin = hashedPin;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Transaction PIN has been updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
