import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileName = (formData.get('fileName') as string) || file?.name || `upload_${Date.now()}`;
    const folder = (formData.get('folder') as string) || '/neoblue';

    if (!file) {
      return NextResponse.json({ error: 'No file provided for upload.' }, { status: 400 });
    }

    const publicKey = cleanKey(
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY,
      DEFAULT_PUBLIC_KEY
    );
    const privateKey = cleanKey(process.env.IMAGEKIT_PRIVATE_KEY, DEFAULT_PRIVATE_KEY);
    const urlEndpoint = cleanKey(
      process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT,
      DEFAULT_URL_ENDPOINT
    );

    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: fileName.replace(/[^a-zA-Z0-9._-]/g, '_'),
      folder: folder.startsWith('/') ? folder : `/${folder}`,
      useUniqueFileName: true,
    });

    return NextResponse.json({
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
      url: uploadResponse.url,
      secure_url: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl || uploadResponse.url,
      filePath: uploadResponse.filePath,
    });
  } catch (error: any) {
    console.error('ImageKit server upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload file to ImageKit.' },
      { status: 500 }
    );
  }
}
