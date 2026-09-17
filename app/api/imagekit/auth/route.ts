import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || 'public_PpR/ru4+6djczlUeXQ+rpde5y70=';
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'private_K8VM3Nlmg88eG3RukH8AthQtmkw=';
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/dsh4kn2d6';

    if (!privateKey || !publicKey) {
      return NextResponse.json(
        { 
          error: 'ImageKit keys are not configured.',
          configured: false,
        },
        { status: 400 }
      );
    }

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 2400; // 40 minutes expiration
    const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');

    return NextResponse.json({
      token,
      expire,
      signature,
      publicKey,
      urlEndpoint,
    });
  } catch (error: any) {
    console.error('ImageKit auth error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate ImageKit authentication parameters.' },
      { status: 500 }
    );
  }
}
