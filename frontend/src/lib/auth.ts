import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, JWTPayloadData } from './jwt';
import { UserRole } from '@/types';
import { connectToDatabase } from './mongodb';
import User from '@/models/User';

export async function getAuthUser(req: NextRequest): Promise<JWTPayloadData | null> {
  const authHeader = req.headers.get('authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    const cookieToken = req.cookies.get('bank_auth_token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  await connectToDatabase();
  const dbUser = await User.findById(payload.userId).select('status isBlocked role');
  if (!dbUser || dbUser.isBlocked || dbUser.status !== 'active') {
    return null;
  }

  return {
    ...payload,
    role: dbUser.role as UserRole,
  };
}

export function unauthorizedResponse(message = 'Unauthorized access') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Forbidden: Insufficient privileges') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}
