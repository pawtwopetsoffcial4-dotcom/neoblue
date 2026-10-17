import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Secret from '@/lib/models/Secret';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

function requireAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

const WATCHED_ENV_KEYS = [
  'ONESIGNAL_APP_ID',
  'ONESIGNAL_REST_API_KEY',
  'SENDER_API_TOKEN',
  'SENDER_FROM_EMAIL',
  'SENDER_GROUP_ID',
  'MONGODB_URI',
];

// GET: list stored secret keys with a masked preview (never returns full values),
// plus a diagnostic showing whether each watched key is present as an env var —
// booleans only, never the value — to debug "configured on one host but not another".
export async function GET(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return createErrorResponse('Forbidden: Admin access required', 403);
    }

    await connectDB();
    const secrets = await Secret.find({}).select('key value updatedAt').sort({ key: 1 });

    const masked = secrets.map((s) => ({
      key: s.key,
      preview: s.value.length > 4 ? `${'*'.repeat(Math.max(0, s.value.length - 4))}${s.value.slice(-4)}` : '****',
      updatedAt: s.updatedAt,
    }));

    const envPresence = WATCHED_ENV_KEYS.map((key) => ({
      key,
      presentInEnv: Boolean(process.env[key]),
    }));

    return createSuccessResponse({ secrets: masked, envPresence });
  } catch (error) {
    console.error('Get secrets error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch secrets', 500);
  }
}

// POST: create or update a secret { key, value }
export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return createErrorResponse('Forbidden: Admin access required', 403);
    }

    await connectDB();
    const { key, value } = await request.json();

    const trimmedKey = String(key || '').trim();
    if (!trimmedKey || typeof value !== 'string' || !value.trim()) {
      return createErrorResponse('Both key and value are required', 400);
    }

    await Secret.findOneAndUpdate(
      { key: trimmedKey },
      { $set: { value: value.trim() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return createSuccessResponse({ message: `Secret "${trimmedKey}" saved successfully` });
  } catch (error) {
    console.error('Save secret error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to save secret', 500);
  }
}

// DELETE: remove a secret by key (?key=NAME)
export async function DELETE(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return createErrorResponse('Forbidden: Admin access required', 403);
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) {
      return createErrorResponse('Key is required', 400);
    }

    await Secret.deleteOne({ key });
    return createSuccessResponse({ message: `Secret "${key}" removed successfully` });
  } catch (error) {
    console.error('Delete secret error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to delete secret', 500);
  }
}
