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

const DEFAULT_DIRECT_URI =
  'mongodb://pariharsachin5002_db_user:8668369314@ac-fbnjtgg-shard-00-02.rjpvr9t.mongodb.net:27017,ac-fbnjtgg-shard-00-00.rjpvr9t.mongodb.net:27017,ac-fbnjtgg-shard-00-01.rjpvr9t.mongodb.net:27017/test?ssl=true&replicaSet=atlas-hivqj1-shard-0&authSource=admin&appName=Cluster0';

function getMongoUris() {
  const srv = getEnv('MONGODB_URI')?.trim();
  const direct = getEnv('MONGODB_URI_DIRECT')?.trim();

  const primary = srv || direct || DEFAULT_DIRECT_URI;
  const fallback = direct && direct !== primary ? direct : DEFAULT_DIRECT_URI;

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
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
      socketTimeoutMS: 6000,
      waitQueueTimeoutMS: 2000,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 8000,
    };

    cached.promise = (async () => {
      try {
        return await doConnect(primary, opts, 8000);
      } catch (primaryError: any) {
        if (fallback && fallback !== primary) {
          console.warn('Primary MongoDB URI failed, attempting fallback URI...', primaryError.message);
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
