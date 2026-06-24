import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing.');
  }
  return secret;
}

let googlePublicKeys: Record<string, string> | null = null;
let googlePublicKeysExpires = 0;

async function getGooglePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (googlePublicKeys && now < googlePublicKeysExpires) {
    return googlePublicKeys;
  }

  const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!response.ok) {
    throw new Error('Failed to fetch Google public keys for Firebase token verification.');
  }

  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3600 * 1000;

  googlePublicKeys = await response.json();
  googlePublicKeysExpires = now + maxAge;
  return googlePublicKeys!;
}

export async function verifyFirebaseIdToken(token: string): Promise<{ email: string; name?: string; uid: string } | null> {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      return null;
    }

    const kid = decoded.header.kid;
    const publicKeys = await getGooglePublicKeys();
    const cert = publicKeys[kid];

    if (!cert) {
      return null;
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.warn('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined in environment variables. Firebase token validation might fail.');
      return null;
    }

    const verified = jwt.verify(token, cert, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    }) as any;

    if (!verified || !verified.email || !verified.sub) {
      return null;
    }

    return {
      email: verified.email,
      name: verified.name,
      uid: verified.sub,
    };
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'vendor' | 'admin';
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

export function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}
