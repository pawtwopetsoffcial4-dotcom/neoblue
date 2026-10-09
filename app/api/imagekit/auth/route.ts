import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function cleanKey(raw: string | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  let val = raw.trim();
  val = val.replace(/^["']|["']$/g, '').trim();
  val = val.replace(/^(public|private)\s*key\s*[:=]?\s*/i, '');
  return val.trim();
}

export async function GET() {
  try {
    const publicKey = cleanKey(
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY
    );
    const privateKey = cleanKey(process.env.IMAGEKIT_PRIVATE_KEY);
    const urlEndpoint = cleanKey(
      process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT
    );

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
