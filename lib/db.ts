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

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI_DIRECT = process.env.MONGODB_URI_DIRECT;
const DB_RETRY_COOLDOWN_MS = 30_000;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;
let connectivityState = global.mongoConnectivityState;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

if (!connectivityState) {
  connectivityState = global.mongoConnectivityState = { nextRetryAt: 0 };
}

export const isDatabaseConnectivityError = (error: any) =>
  error?.code === 'DB_CONNECTIVITY_UNAVAILABLE' ||
  error?.code === 'ECONNREFUSED' ||
  String(error?.message || '').includes('querySrv') ||
  String(error?.message || '').includes('MongoDB SRV lookup failed');

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (Date.now() < connectivityState.nextRetryAt) {
    const retryInSec = Math.ceil((connectivityState.nextRetryAt - Date.now()) / 1000);
    const error = new Error(`MongoDB temporarily unavailable. Retrying in ~${retryInSec}s.`) as Error & {
      code?: string;
    };
    error.code = 'DB_CONNECTIVITY_UNAVAILABLE';
    throw error;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => mongoose as any)
      .catch(async (error: any) => {
        const isSrvLookupFailure = isDatabaseConnectivityError(error);

        if (isSrvLookupFailure && MONGODB_URI_DIRECT) {
          try {
            // Fallback for environments where SRV DNS records are blocked.
            return (await mongoose.connect(MONGODB_URI_DIRECT, opts)) as any;
          } catch (directError: any) {
            if (isDatabaseConnectivityError(directError)) {
              connectivityState.nextRetryAt = Date.now() + DB_RETRY_COOLDOWN_MS;
              const wrapped = new Error('MongoDB temporarily unavailable via both SRV and direct URI.') as Error & {
                code?: string;
              };
              wrapped.code = 'DB_CONNECTIVITY_UNAVAILABLE';
              throw wrapped;
            }
            throw directError;
          }
        }

        if (isSrvLookupFailure) {
          connectivityState.nextRetryAt = Date.now() + DB_RETRY_COOLDOWN_MS;
          const hint =
            'MongoDB SRV lookup failed. Check DNS/network policy or set MONGODB_URI_DIRECT to a non-SRV Atlas URI.';
          const wrapped = new Error(`${hint} Original error: ${error?.message || 'Unknown error'}`) as Error & {
            code?: string;
          };
          wrapped.code = 'DB_CONNECTIVITY_UNAVAILABLE';
          throw wrapped;
        }

        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    connectivityState.nextRetryAt = 0;
  } catch (e) {
    cached.promise = null;

    if (isDatabaseConnectivityError(e)) {
      connectivityState.nextRetryAt = Date.now() + DB_RETRY_COOLDOWN_MS;
    }

    throw e;
  }

  return cached.conn;
}

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
  var mongoConnectivityState: {
    nextRetryAt: number;
  };
}
