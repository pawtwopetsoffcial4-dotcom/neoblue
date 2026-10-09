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

mongoose.set('autoIndex', false);
mongoose.set('autoCreate', false);

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
  String(error?.message || '').includes('connection pool') ||
  String(error?.message || '').includes('topology') ||
  String(error?.message || '').includes('closed') ||
  String(error?.message || '').includes('MongoDB SRV lookup failed');

function getEnv(key: string): string | undefined {
  return process.env[key];
}

function getMongoUris() {
  const direct = getEnv('MONGODB_URI_DIRECT')?.trim();
  const srv = getEnv('MONGODB_URI')?.trim();

  const primary = direct || srv || '';
  const fallback = srv && srv !== primary ? srv : direct || '';

  if (!primary) {
    throw new Error('FATAL CONFIGURATION ERROR: Neither MONGODB_URI nor MONGODB_URI_DIRECT is defined.');
  }

  return { primary, fallback };
}

async function doConnect(uri: string, opts: mongoose.ConnectOptions, timeoutMs = 8500) {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(
        `MongoDB connection timed out after ${timeoutMs}ms. Verify MONGODB_URI and MongoDB Atlas Network Access whitelist.`
      ) as Error & { code?: string };
      err.code = 'DB_CONNECTIVITY_TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  const connectPromise = mongoose.connect(uri, opts);
  // Prevent unhandled promise rejection if timeout fires first
  connectPromise.catch((err) => {
    console.warn('[connectDB background]', err?.message || err);
  });

  try {
    return await Promise.race([connectPromise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function disconnectDB() {
  cached.conn = null;
  cached.promise = null;
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {}
}

export async function connectDB(forceFresh = false) {
  if (!forceFresh && cached.conn && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    return cached.conn;
  }

  if (forceFresh || (cached.conn && mongoose.connection.readyState !== 1)) {
    cached.conn = null;
    cached.promise = null;
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch {}
  }

  if (!cached.promise) {
    const { primary, fallback } = getMongoUris();

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 8000,
      waitQueueTimeoutMS: 10000,
      maxPoolSize: 20,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
    };

    cached.promise = (async () => {
      try {
        return await doConnect(primary, opts, 8000);
      } catch (primaryError: any) {
        if (fallback && fallback !== primary) {
          console.warn('Primary MongoDB URI failed, attempting fallback URI...', primaryError.message);
          try {
            await mongoose.disconnect();
          } catch {}
          return await doConnect(fallback, opts, 6000);
        }
        throw primaryError;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

declare global {
  var mongoose: {
    conn: any;
    promise: Promise<any> | null;
  };
  var employeeIndexesCleaned: boolean | undefined;
}
