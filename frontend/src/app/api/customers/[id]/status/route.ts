import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import BankAccount from '@/models/BankAccount';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    if (authUser.role !== 'admin' && authUser.role !== 'staff') {
      return forbiddenResponse('Only Admin and Bank Staff can modify customer roles or status');
    }

    const { id } = await params;
    const { status, isBlocked, role } = await req.json();

    if (role && authUser.role !== 'admin') {
      return forbiddenResponse('Only administrators can change user roles');
    }

    await connectToDatabase();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    if (role) updateData.role = role;

    const customer = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select('-password');

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Synchronize customer bank accounts status on approval or suspension
    if (status === 'active') {
      await BankAccount.updateMany({ userId: customer._id }, { status: 'active' });
    } else if (status === 'inactive' || status === 'suspended') {
      await BankAccount.updateMany({ userId: customer._id }, { status: 'frozen' });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
