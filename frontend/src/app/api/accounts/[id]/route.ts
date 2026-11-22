import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import BankAccount from '@/models/BankAccount';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const { id } = await params;
    await connectToDatabase();

    const account = await BankAccount.findById(id).populate(
      'userId',
      'name email phone status isBlocked'
    );
    if (!account) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    if (
      authUser.role === 'customer' &&
      account.userId._id.toString() !== authUser.userId
    ) {
      return forbiddenResponse();
    }

    return NextResponse.json(account);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
