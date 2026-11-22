import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import BankAccount from '@/models/BankAccount';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    if (authUser.role !== 'admin' && authUser.role !== 'staff') {
      return forbiddenResponse('Only Admin and Bank Staff can update account status');
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!['active', 'frozen', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid account status' }, { status: 400 });
    }

    await connectToDatabase();

    const account = await BankAccount.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
