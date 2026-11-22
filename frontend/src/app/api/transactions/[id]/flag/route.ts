import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    if (authUser.role !== 'staff' && authUser.role !== 'admin') {
      return forbiddenResponse('Only Bank Staff and Admin can flag transactions');
    }

    const { id } = await params;
    const { flagReason } = await req.json();

    if (!flagReason || flagReason.trim() === '') {
      return NextResponse.json(
        { error: 'A reason must be provided to flag this transaction' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const transaction = await Transaction.findOneAndUpdate(
      {
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { transactionId: id }],
      },
      {
        flaggedForReview: true,
        flagReason: `${authUser.name} (${authUser.role}): ${flagReason.trim()}`,
      },
      { new: true }
    );

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
