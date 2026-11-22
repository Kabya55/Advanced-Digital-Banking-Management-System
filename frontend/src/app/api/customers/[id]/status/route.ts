import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    if (authUser.role !== 'admin') {
      return forbiddenResponse('Only Admin can modify customer block/active status');
    }

    const { id } = await params;
    const { status, isBlocked } = await req.json();

    await connectToDatabase();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;

    const customer = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select('-password');

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
