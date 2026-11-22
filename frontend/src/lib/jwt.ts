import { SignJWT, jwtVerify } from 'jose';
import { UserRole, UserStatus } from '@/types';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'c5d1e2f49a88390b17e42d72bcf9215037d45a9678129e46fca05295c1a8e10b';
const secretKeyBytes = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayloadData {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  isBlocked: boolean;
}

export async function signJWT(payload: JWTPayloadData): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKeyBytes);

  return token;
}

export async function verifyJWT(token: string): Promise<JWTPayloadData | null> {
  try {
    const { payload } = await jwtVerify(token, secretKeyBytes);
    return payload as unknown as JWTPayloadData;
  } catch (err) {
    return null;
  }
}
