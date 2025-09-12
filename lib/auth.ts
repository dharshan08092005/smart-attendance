import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface UserPayload {
  userId: string;
  email: string;
  userType: string;
  collectionName: string;
}

export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as UserPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}
