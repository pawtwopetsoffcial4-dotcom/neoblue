import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'neoblue-media';

/**
 * Checks if Cloudflare R2 / S3 credentials are fully configured
 */
export function isR2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

/**
 * Returns S3 Client initialized for Cloudflare R2 S3-compatible API
 */
export function getR2Client(): S3Client | null {
  if (!isR2Configured()) return null;

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Uploads a file buffer directly to Cloudflare R2 permanent storage
 */
export async function uploadToR2(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<{ key: string; bucket: string }> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured. Please set R2 environment variables.');
  }

  const cleanKey = key.replace(/^\/+/, '');

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    key: cleanKey,
    bucket: R2_BUCKET_NAME,
  };
}

/**
 * Generates a presigned URL for direct browser-to-R2 uploads
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string = 'image/jpeg',
  expiresInSeconds: number = 3600
): Promise<{ uploadUrl: string; key: string }> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const cleanKey = key.replace(/^\/+/, '');

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    key: cleanKey,
  };
}

/**
 * Deletes an object from Cloudflare R2 permanent storage
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key.replace(/^\/+/, ''),
      })
    );
    return true;
  } catch (err) {
    console.error('Failed to delete object from R2:', err);
    return false;
  }
}
