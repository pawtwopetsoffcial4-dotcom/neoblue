import { connectDB } from '@/lib/db';
import Secret from '@/lib/models/Secret';
import { seedDefaultSecrets } from '@/lib/utils/seedSecrets';

/**
 * Reads a secret from the database first, falling back to the environment
 * variable of the same name if no DB record exists. This lets secrets be
 * managed from the admin panel without relying on hosting-platform env vars.
 */
export async function getSecret(key: string): Promise<string | undefined> {
  try {
    await connectDB();
    await seedDefaultSecrets();
    const record = await Secret.findOne({ key }).lean<{ value?: string } | null>();
    if (record?.value) {
      return record.value;
    }
  } catch (error) {
    console.error(`Failed to read secret "${key}" from database:`, error);
  }

  return process.env[key];
}
