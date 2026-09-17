import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function cleanKey(raw: string | undefined, defaultVal: string): string {
  if (!raw || typeof raw !== 'string') return defaultVal;
  let val = raw.trim();
  val = val.replace(/^["']|["']$/g, '').trim();
  val = val.replace(/^(public|private)\s*key\s*[:=]?\s*/i, '');
  return val.trim() || defaultVal;
}

const DEFAULT_PUBLIC_KEY = 'public_PpR/ru4+6djczlUeXQ+rpde5y70=';
const DEFAULT_PRIVATE_KEY = 'private_K8VM3Nlmg88eG3RukH8AthQtmkw=';
const DEFAULT_URL_ENDPOINT = 'https://ik.imagekit.io/dsh4kn2d6';

export async function GET() {
  try {
    const publicKey = cleanKey(
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY,
      DEFAULT_PUBLIC_KEY
    );
    const privateKey = cleanKey(process.env.IMAGEKIT_PRIVATE_KEY, DEFAULT_PRIVATE_KEY);
    const urlEndpoint = cleanKey(
      process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT,
      DEFAULT_URL_ENDPOINT
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
