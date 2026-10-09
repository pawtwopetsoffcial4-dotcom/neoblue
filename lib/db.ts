import mongoose from 'mongoose';
import './models/User';
import './models/Product';
import './models/Order';
import './models/Blog';
import './models/BlogCategory';
import './models/BlogTag';
import './models/BlogComment';
import './models/BlogAnalytics';
import './models/Review';
import { dropLegacyEmployeeIndexes } from './models/Employee';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const isDatabaseConnectivityError = (error: any) =>
  error?.code === 'DB_CONNECTIVITY_UNAVAILABLE' ||
  error?.code === 'DB_CONNECTIVITY_TIMEOUT' ||
  error?.code === 'ECONNREFUSED' ||
  String(error?.message || '').includes('querySrv') ||
  String(error?.message || '').includes('timed out') ||
  String(error?.message || '').includes('MongoDB SRV lookup failed');

function getEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx?.env && ctx.env[key]) return String(ctx.env[key]);
  } catch {}
  return undefined;
}

function getMongoUris() {
  const direct = getEnv('MONGODB_URI_DIRECT')?.trim();
  const srv = getEnv('MONGODB_URI')?.trim();

  if (!direct && !srv) {
    const error = new Error(
      'MongoDB connection URI missing: Please define MONGODB_URI_DIRECT (recommended for Cloudflare) or MONGODB_URI in Cloudflare Dashboard (Settings > Variables and Secrets) or .env.local.'
    ) as Error & { code?: string };
    error.code = 'DB_CONNECTIVITY_UNAVAILABLE';
    throw error;
  }

  // Prioritize direct URI (mongodb://) because SRV DNS lookups (mongodb+srv://)
  // fail or hang in Cloudflare Workers / serverless isolates due to lack of UDP dns.resolveSrv.
  const primary = direct || srv!;
  const fallback = direct && srv && direct !== srv ? srv : null;

  return { primary, fallback };
}

async function doConnect(uri: string, opts: mongoose.ConnectOptions) {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(
        'MongoDB connection timed out after 6000ms. In Cloudflare Workers, SRV lookup (mongodb+srv://) is not supported; set MONGODB_URI_DIRECT in Cloudflare Settings > Variables and Secrets, and verify MongoDB Atlas Network Access allows 0.0.0.0/0.'
      ) as Error & { code?: string };
      err.code = 'DB_CONNECTIVITY_TIMEOUT';
      reject(err);
    }, 6000);
    if (typeof timer?.unref === 'function') timer.unref();
  });

  try {
    return await Promise.race([mongoose.connect(uri, opts), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const { primary, fallback } = getMongoUris();

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
    };

    cached.promise = (async () => {
      try {
        return await doConnect(primary, opts);
      } catch (primaryError: any) {
        if (fallback && fallback !== primary) {
          console.warn('Primary MongoDB URI failed, attempting fallback URI...', primaryError.message);
          return await doConnect(fallback, opts);
        }
        throw primaryError;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    if (!global.employeeIndexesCleaned) {
      global.employeeIndexesCleaned = true;
      await dropLegacyEmployeeIndexes().catch(() => {});
    }
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
  var employeeIndexesCleaned: boolean | undefined;
}
