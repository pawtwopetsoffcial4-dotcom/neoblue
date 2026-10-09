import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';
import { isR2Configured, uploadToR2 } from '@/lib/storage/r2';
import { extractStorageKey, getMediaUrl } from '@/lib/media';

export const dynamic = 'force-dynamic';

function cleanKey(raw: string | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  let val = raw.trim();
  val = val.replace(/^["']|["']$/g, '').trim();
  val = val.replace(/^(public|private)\s*key\s*[:=]?\s*/i, '');
  return val.trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileName = (formData.get('fileName') as string) || file?.name || `upload_${Date.now()}`;
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return NextResponse.json({ error: 'No file provided for upload.' }, { status: 400 });
    }

    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${cleanFolder}/${Date.now()}_${cleanFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. If Cloudflare R2 is configured, archive original master copy permanently
    let r2Key: string | null = null;
    if (isR2Configured()) {
      try {
        const r2Result = await uploadToR2(buffer, storageKey, file.type || 'image/jpeg');
        r2Key = r2Result.key;
      } catch (r2Err) {
        console.warn('Cloudflare R2 master archive warning (proceeding with ImageKit):', r2Err);
      }
    }

    // 2. Upload to ImageKit for on-the-fly transformations & CDN edge delivery
    const publicKey = cleanKey(
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY
    );
    const privateKey = cleanKey(process.env.IMAGEKIT_PRIVATE_KEY);
    const urlEndpoint = cleanKey(
      process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT
    );

    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: cleanFileName,
      folder: `/${cleanFolder}`,
      useUniqueFileName: true,
    });

    const finalKey = r2Key || extractStorageKey(uploadResponse.filePath || uploadResponse.url) || storageKey;
    const cdnUrl = uploadResponse.url || getMediaUrl(finalKey);

    return NextResponse.json({
      key: finalKey,
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
      url: cdnUrl,
      secure_url: cdnUrl,
      thumbnailUrl: uploadResponse.thumbnailUrl || getMediaUrl(finalKey, { width: 160, height: 160 }),
      filePath: uploadResponse.filePath,
      r2Archived: Boolean(r2Key),
    });
  } catch (error: any) {
    console.error('Unified upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media file.' },
      { status: 500 }
    );
  }
}
