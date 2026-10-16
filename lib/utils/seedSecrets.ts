import mongoose from 'mongoose';
import Secret from '@/lib/models/Secret';

// Keys that get auto-promoted from process.env into the DB the first time
// this runs against a given database — e.g. right after a host migration —
// so a key only ever has to be set once, in whichever place it's available.
// Existing DB keys are never overwritten, so an admin's own edit via
// /api/admin/secrets always wins.
const SECRET_KEYS = [
  'ONESIGNAL_APP_ID',
  'ONESIGNAL_REST_API_KEY',
  'SENDER_API_TOKEN',
  'SENDER_FROM_EMAIL',
  'SENDER_GROUP_ID',
];

export async function seedDefaultSecrets(): Promise<void> {
  if (global.secretsSeeded) return;
  global.secretsSeeded = true;

  try {
    if (mongoose.connection.readyState !== 1) return;

    const existingSecrets = await Secret.find({}).select('key').lean<{ key: string }[]>();
    const existingKeys = new Set(existingSecrets.map((s) => s.key));

    const toSeed = SECRET_KEYS
      .filter((key) => !existingKeys.has(key) && process.env[key])
      .map((key) => ({ key, value: process.env[key] as string }));

    if (toSeed.length > 0) {
      await Secret.insertMany(toSeed, { ordered: false });
      console.log(`[Secrets] Seeded ${toSeed.length} secret(s) from environment into the database.`);
    }
  } catch (error) {
    console.error('[Secrets] Auto-seed failed:', error);
  }
}

declare global {
  var secretsSeeded: boolean | undefined;
}
