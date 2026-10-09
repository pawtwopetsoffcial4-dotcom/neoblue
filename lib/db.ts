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

const DEFAULT_DIRECT_URI =
  'mongodb://pariharsachin5002_db_user:8668369314@ac-fbnjtgg-shard-00-02.rjpvr9t.mongodb.net:27017,ac-fbnjtgg-shard-00-00.rjpvr9t.mongodb.net:27017,ac-fbnjtgg-shard-00-01.rjpvr9t.mongodb.net:27017/test?ssl=true&replicaSet=atlas-hivqj1-shard-0&authSource=admin&appName=Cluster0';

function getMongoUris() {
  let direct = getEnv('MONGODB_URI_DIRECT')?.trim();
  const srv = getEnv('MONGODB_URI')?.trim();

  // If direct URI is not explicitly provided, convert known SRV cluster to direct replica set URI
  if (!direct && srv) {
    if (srv.includes('rjpvr9t.mongodb.net')) {
      const match = srv.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@/);
      if (match) {
        const user = match[1];
        const pass = match[2];
        direct = `mongodb://${user}:${pass}@ac-fbnjtgg-shard-00-02.rjpvr9t.mongodb.net:27017,ac-fbnjtgg-shard-00-00.rjpvr9t.mongodb.net:27017,ac-fbnjtgg-shard-00-01.rjpvr9t.mongodb.net:27017/test?ssl=true&replicaSet=atlas-hivqj1-shard-0&authSource=admin&appName=Cluster0`;
      } else {
        direct = DEFAULT_DIRECT_URI;
      }
    } else if (!srv.startsWith('mongodb+srv://')) {
      direct = srv;
    }
  }

  if (!direct && !srv) {
    direct = DEFAULT_DIRECT_URI;
  }

  // Never use mongodb+srv:// on Cloudflare Workers because dns.resolveSrv hangs in Workers runtime
  const primary = direct || DEFAULT_DIRECT_URI;
  const fallback = srv && !srv.startsWith('mongodb+srv://') && srv !== primary ? srv : null;

  return { primary, fallback };
}

async function doConnect(uri: string, opts: mongoose.ConnectOptions, timeoutMs = 8500) {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(
        `MongoDB connection timed out after ${timeoutMs}ms. In Cloudflare Workers, SRV lookup (mongodb+srv://) is not supported; set MONGODB_URI_DIRECT in Cloudflare Settings > Variables and Secrets, and verify MongoDB Atlas Network Access allows 0.0.0.0/0.`
      ) as Error & { code?: string };
      err.code = 'DB_CONNECTIVITY_TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  const connectPromise = mongoose.connect(uri, opts);
  // Prevent unhandled promise rejection in Cloudflare Workers isolate if timeout fires first
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
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 8000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 8000,
    };

    cached.promise = (async () => {
      try {
        return await doConnect(primary, opts, 10000);
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
